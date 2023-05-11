// https://mvdwf.bitwiseworkshop.nl/donations/project/17356
// https://mvdwf.bitwiseworkshop.nl/amount/project/17356

// https://mvdwf.bitwiseworkshop.nl/distance/2021/12/10/7/1/0/2021/12/10/19/0/0/50/0
// https://mvdwf.bitwiseworkshop.nl/distance/2021/12/11/6/0/0/2021/12/11/19/0/0/50/50
// https://mvdwf.bitwiseworkshop.nl/distance/2021/12/12/5/0/0/2021/12/12/19/0/0/50/100
// https://mvdwf.bitwiseworkshop.nl/distance/2021/12/13/4/0/0/2021/12/13/19/0/0/50/150

const fs = require('fs')

var httpsCheck = false

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
const QrGeneratorClass = require('./modules/qr_generator')

const QrGenerator = new QrGeneratorClass()

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

// countdown page
app.get('/countdown/:startyear/:startmonth/:startday/:starthour/:startminute/:startsecond/:endyear/:endmonth/:endday/:endhour/:endminute/:endsecond', function(req, res) {
  var startDate = {
    year: req.params['startyear'],
    month: req.params['startmonth'],
    day: req.params['startday'],
    hour: req.params['starthour'],
    minute: req.params['startminute'],
    second: req.params['startsecond']
  }
  var endDate = {
    year: req.params['endyear'],
    month: req.params['endmonth'],
    day: req.params['endday'],
    hour: req.params['endhour'],
    minute: req.params['endminute'],
    second: req.params['endsecond']
  }
  res.render('pages/countdown/index', {startDate: startDate, endDate: endDate});
});

// distance page
app.get('/distance/:startyear/:startmonth/:startday/:starthour/:startminute/:startsecond/:endyear/:endmonth/:endday/:endhour/:endminute/:endsecond/:distance/:startdistance', function(req, res) {
  var startDate = {
    year: req.params['startyear'],
    month: req.params['startmonth'],
    day: req.params['startday'],
    hour: req.params['starthour'],
    minute: req.params['startminute'],
    second: req.params['startsecond']
  }
  var endDate = {
    year: req.params['endyear'],
    month: req.params['endmonth'],
    day: req.params['endday'],
    hour: req.params['endhour'],
    minute: req.params['endminute'],
    second: req.params['endsecond']
  }
  res.render('pages/distance/index', {startDate: startDate, endDate: endDate, distance: req.params["distance"], startDistance: req.params["startdistance"]});
});

// map page
app.get('/map/:startyear/:startmonth/:startday/:starthour/:startminute/:startsecond/:endyear/:endmonth/:endday/:endhour/:endminute/:endsecond/:distance/:startdistance', function(req, res) {
  var startDate = {
    year: req.params['startyear'],
    month: req.params['startmonth'],
    day: req.params['startday'],
    hour: req.params['starthour'],
    minute: req.params['startminute'],
    second: req.params['startsecond']
  }
  var endDate = {
    year: req.params['endyear'],
    month: req.params['endmonth'],
    day: req.params['endday'],
    hour: req.params['endhour'],
    minute: req.params['endminute'],
    second: req.params['endsecond']
  }
  res.render('pages/map/index', {startDate: startDate, endDate: endDate, distance: req.params["distance"], startDistance: req.params["startdistance"], googleMapsApiKey: process.argv[3]});
});

// title page
app.get('/title/:titleText', function(req, res) {
  res.render('pages/title/index', {titleText: req.params['titleText']});
});

// /favicon.ico
app.get('/favicon.ico', function(req, res) {
  res.sendStatus(404)
});

app.get('/api/qr/:type/:id', async function(req, res) {
  var imgData = await QrGenerator.generate(req.params.type, req.params.id)
  res.json({"qr": imgData})
});



app.get('/:page', function(req, res) {
  res.render('pages/' + req.params['page'] + '/index');
});

var httpServer = http.createServer(app);
httpServer.listen(9040);

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

console.log('Http Server is listening on port 9040');

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

