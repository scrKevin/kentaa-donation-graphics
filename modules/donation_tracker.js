const WebSocket = require('ws');
var KentaaApi = require('kentaa-api');
const API_KEY = process.argv[2];

let ka = new KentaaApi(API_KEY)

const DEBUG = true;
const POLL_INTERVAL = 30000;
const DISPLAY_INTERVAL = 15000;
const N_TO_SHOW_AT_STARTUP = 4;

module.exports = class DonationTracker {
  
  clients = []

  donationQueue = []
  lastUpdate = new Date(Date.now() - POLL_INTERVAL)
  pollInterval = null

  displayInterval = null
  isDisplaying = false
  startup = false

  constructor(type, id) {
    console.log("Creating new donationtracker for " + type + ": " + id)
    this.type = type
    this.id = id
    this.wss = new WebSocket.Server({noServer: true});

    this.wss.on('connection', (ws) => {
      var connectedClients = this.clients.length;
      this.clients.push(ws);
      console.log("added client")
      //console.log(clients)
      if (connectedClients == 0) {
        this.startDonationPoll()
      }
      
      ws.on('message', (data) => {
        console.log('received: %s', data);
      });
  
      ws.on('close', () => {
        this.removeItemOnce(this.clients, ws)
        console.log("removed client")
        //console.log(clients)
        if (this.clients.length == 0) {
          this.stopDonationPoll()
        }
      });
    });
  }

  startDisplayInterval() {
    if (!this.isDisplaying) {
      if (this.displayInterval != null) {
        clearInterval(this.displayInterval);
      }
      console.log("Starting to display donations.")
      this.displayInterval = setInterval(() => this.displayNextDonation(), DISPLAY_INTERVAL)
      this.isDisplaying = true;
      this.displayNextDonation()
    }
  }

  stopDisplayInterval() {
    if (this.displayInterval != null) {
      clearInterval(this.displayInterval);
    }
    this.isDisplaying = false;
    console.log("Displaying halted.")
  }

  displayNextDonation() {
    if (this.donationQueue.length > 0) {
      var nextDonation = this.donationQueue.shift()
      var displayName = nextDonation.first_name
      var displayAmount = nextDonation.amount
      var message = "";
      if (nextDonation.hasOwnProperty('message')) {
        message = nextDonation.message
      }
      if (nextDonation.hasOwnProperty('company')) {
        displayName = nextDonation.company
      }
      if (nextDonation.anonymous) {
        displayName = "Anoniem"
      }
      if ( typeof displayName === 'undefined' || !displayName ) {
        displayName = "";
      }
      if ( typeof displayAmount === 'undefined' || !displayAmount ) {
        displayAmount = "";
      } else {
        displayAmount = Number(displayAmount)
      }
      var toSend = {
        type: "displayDonation",
        payload: {
          name: displayName,
          amount: displayAmount,
          message: message
        }
      }
      console.log("next to display:")
      console.log(toSend)
      this.broadcast(toSend)
    } else {
      this.stopDisplayInterval()
    }
  }

  startDonationPoll() {
    console.log("Starting poll interval for donations for " + this.type + ": " + this.id)
    var history = POLL_INTERVAL;
    this.startup = true;
    if (DEBUG) {
      // get donations of the last day.
      history = 1000*60*60*24
    }
    this.lastUpdate = new Date(Date.now() - history)
    if (this.pollInterval != null) {
      clearInterval(this.pollInterval)
    }
    this.pollInterval = setInterval(() => this.getNewDonations(), POLL_INTERVAL)
    this.getNewDonations()
  }

  stopDonationPoll() {
    this.startup = false;
    console.log("Stopping poll interval.")
    this.lastUpdate = new Date()
    if (this.pollInterval != null) {
      clearInterval(this.pollInterval)
      console.log("Poll interval cleared.")
    }
  }

  async getNewDonations() {
    console.log("Getting donations for " + this.type + " (" + this.id + ") since " + this.lastUpdate.toISOString())
    var now = Date.now()
    
    if (this.type == "action") {
      var newDonations = await ka.action(this.id).donations.list({"updated_after": this.lastUpdate})
    }
    else if (this.type == "segment") {
      var newDonations = await ka.segment(this.id).donations.list({"updated_after": this.lastUpdate})
    }
    else if (this.type == "team") {
      var newDonations = await ka.team(this.id).donations.list({"updated_after": this.lastUpdate})
    }
    else if (this.type == "project") {
      var newDonations = await ka.project(this.id).donations.list({"updated_after": this.lastUpdate})
    }
    else if (this.type == "all") {
      var newDonations = await ka.donations.list({"updated_after": this.lastUpdate})
    }
    this.lastUpdate = new Date(now);
    console.log(newDonations)
    var hasNewDonations = false;
    for (let newDonation of newDonations) {
      if (newDonation.payment_status == "paid") {
        this.donationQueue.push(newDonation)
        hasNewDonations = true
      }
    }
    if (this.startup) {
      this.startup = false;
      if (this.donationQueue.length > N_TO_SHOW_AT_STARTUP) {
        while (this.donationQueue.length > N_TO_SHOW_AT_STARTUP) {
          this.donationQueue.shift()
        }
      }
    }
    if (hasNewDonations) {
      this.startDisplayInterval();
    }
  }

  removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }

  broadcast(msg) {
    var toSend = JSON.stringify(msg)
    for (let client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(toSend)
      }
    }
  }

  

}