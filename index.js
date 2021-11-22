const fs = require('fs')

const httpsCheck = false

const keyPath = __dirname + '/cert/privkey.pem'
const certificatePath = __dirname + '/cert/fullchain.pem'

try {
  if (fs.existsSync(keyPath) && fs.existsSync(certificatePath)) {
    httpsCheck = true
  } else {
    console.log("no https")
  }
} catch(err) {
  console.log(err)
}

var http = require('http');

if (httpsCheck) {
  var https = require('https')
  var privateKey  = fs.readFileSync(__dirname + '/cert/privkey.pem', 'utf8');
  var certificate = fs.readFileSync(__dirname + '/cert/fullchain.pem', 'utf8');
  var credentials = {key: privateKey, cert: certificate};
}

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

// stopwatch page
app.get('/stopwatch/:year/:month/:day/:hour/:minute/:second', function(req, res) {
  var startDate = {
    year: req.params['year'],
    month: req.params['month'],
    day: req.params['day'],
    hour: req.params['hour'],
    minute: req.params['minute'],
    second: req.params['second']
  }
  res.render('pages/stopwatch/index', {startDate: startDate});
});

// /favicon.ico
app.get('/favicon.ico', function(req, res) {
  res.sendStatus(404)
});

app.get('/:page', function(req, res) {
  res.render('pages/' + req.params['page'] + '/index');
});

var httpServer = http.createServer(app);
httpServer.listen(8080);

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

console.log('Http Server is listening on port 8080');

if (httpsCheck) {
  var httpsServer = https.createServer(credentials, app);
  httpsServer.listen(443);

  httpsServer.on('upgrade', function upgrade(request, socket, head) {
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
  console.log('Https Server is listening on port 443');
}

