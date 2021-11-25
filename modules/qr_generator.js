var KentaaApi = require('kentaa-api');
const QRCode = require('qrcode')
const API_KEY = process.argv[2];

let ka = new KentaaApi(API_KEY)

const DEBUG = true;

module.exports = class QrGenerator {
  constructor() {}
  async generate(type, id) {
    return new Promise(async (resolve, reject) => {
      if (type == "action") {
        var item = await ka.actions.get(id)
      }
      else if (type == "segment") {
        var item = await ka.segments.get(id)
      }
      else if (type == "team") {
        var item = await ka.teams.get(id)
      }
      else if (type == "project") {
        var item = await ka.projects.get(id)
      }
      console.log(item)
      var opts = {
        errorCorrectionLevel: 'L',
        type: 'image/png',
        margin: 1,
        scale: 2,
        color: {
          dark:"#000000",
          light:"#666"
        }
      }
      QRCode.toDataURL(item[type].donate_url, opts, function (err, url) {
        if (err) throw err
      
        resolve(url)
      })
    })
    
  }
}