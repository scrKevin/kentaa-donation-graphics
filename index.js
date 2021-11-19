var http = require('http');

var express = require('express');
var app = express();

var DonationTracker = require("./modules/donation_tracker")
var AmountTracker = require("./modules/amount_tracker")

var donationTrackers = [];
var amountTrackers = [];

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public')); 

// donations page
app.get('/donations/:type/:id', function(req, res) {
  var found = false;
  for (let donationTracker of donationTrackers) {
    if (donationTracker.id == req.params['id'] && donationTracker.type == req.params['type']) {
      found = true
    }
  }
  if (!found) {
    donationTrackers.push(new DonationTracker(req.params['type'], req.params['id']))
  }
  res.render('pages/donations/index');
});

// amount page
app.get('/amount/:type/:id', function(req, res) {
  var found = false;
  for (let amountTracker of amountTrackers) {
    if (amountTracker.id == req.params['id'] && amountTracker.type == req.params['type']) {
      found = true
    }
  }
  if (!found) {
    amountTrackers.push(new AmountTracker(req.params['type'], req.params['id']))
  }
  res.render('pages/amount/index');
});

var httpServer = http.createServer(app);
httpServer.listen(8080);
//app.listen(8080);

httpServer.on('upgrade', function upgrade(request, socket, head) {
  console.log(request.url)
  var urlSegments = request.url.split("/")
  if (urlSegments.length == 4) {
    if (urlSegments[1] === 'donations') {
      for (let donationTracker of donationTrackers) {
        if (donationTracker.type == urlSegments[2] && donationTracker.id == urlSegments[3]) {
          donationTracker.wss.handleUpgrade(request, socket, head, function done(ws) {
            donationTracker.wss.emit('connection', ws, request);
          });
        }
      }
    }
    else if (urlSegments[1] === 'amount') {
      for (let amountTracker of amountTrackers) {
        if (amountTracker.type == urlSegments[2] && amountTracker.id == urlSegments[3]) {
          amountTracker.wss.handleUpgrade(request, socket, head, function done(ws) {
            amountTracker.wss.emit('connection', ws, request);
          });
        }
      }
    }
  }
});
console.log('Server is listening on port 8080');