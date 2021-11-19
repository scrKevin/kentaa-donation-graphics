const WebSocket = require('ws');
var KentaaApi = require('kentaa-api');
const API_KEY = process.argv[2];

let ka = new KentaaApi(API_KEY)

const DEBUG = true;
const POLL_INTERVAL = 60000;

module.exports = class AmountTracker {
  
  clients = []
  pollInterval = null

  constructor(type, id) {
    console.log("Creating new amounttracker for " + type + ": " + id)
    this.type = type
    this.id = id
    this.wss = new WebSocket.Server({noServer: true});

    this.wss.on('connection', (ws) => {
      var connectedClients = this.clients.length;
      this.clients.push(ws);
      console.log("added client")
      //console.log(clients)
      if (connectedClients == 0) {
        this.startAmountPoll()
      }
      
      ws.on('message', (data) => {
        console.log('received: %s', data);
      });
  
      ws.on('close', () => {
        this.removeItemOnce(this.clients, ws)
        console.log("removed client")
        //console.log(clients)
        if (this.clients.length == 0) {
          this.stopAmountPoll()
        }
      });
    });
  }

  startAmountPoll() {
    console.log("Starting poll interval for amount for " + this.type + ": " + this.id)
    if (this.pollInterval != null) {
      clearInterval(this.pollInterval)
    }
    this.pollInterval = setInterval(() => this.getNewAmount(), POLL_INTERVAL)
    this.getNewAmount()
  }

  stopAmountPoll() {
    console.log("Stopping poll interval.")
    if (this.pollInterval != null) {
      clearInterval(this.pollInterval)
      console.log("Poll interval cleared.")
    }
  }

  async getNewAmount() {
    console.log("Getting new amount")
    
    if (this.type == "action") {
      var newAmount = await ka.actions.get(this.id)
    }
    else if (this.type == "segment") {
      var newAmount = await ka.segments.get(this.id)
    }
    console.log(newAmount)
    if (newAmount.hasOwnProperty("action")) {
      newAmount = newAmount.action
      var amountToSend = 0
      var target_amountToSend = 100
      var nOfDonationsToSend = 0
      if (newAmount.hasOwnProperty('total_amount')) {
        amountToSend = Number(newAmount.total_amount)
      }
      if (newAmount.hasOwnProperty('target_amount')) {
        target_amountToSend = newAmount.target_amount
      }
      if (newAmount.hasOwnProperty('total_donations')) {
        nOfDonationsToSend = newAmount.total_donations
      }
      var toSend = {
        type: "newAmount",
        payload: {
          amount: amountToSend,
          target_amount: target_amountToSend,
          total_donations: nOfDonationsToSend
        }
      }
      this.broadcast(toSend)
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