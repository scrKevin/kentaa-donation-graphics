var KentaaApi = require('./kentaa_api.js');

var API_KEY = process.argv[2];

if (process.env.KENTAA_ENV == 'test') {
    API_KEY = process.env.KENTAA_TEST_API_KEY
  }
  else if (process.env.KENTAA_ENV == 'production') {
    API_KEY = process.env.KENTAA_API_KEY
  }
  
  let ka = new KentaaApi(API_KEY)

module.exports = class IdLister {
    constructor() {}
    async list(type) {
        return new Promise(async (resolve, reject) => {
            var items = []
            if (type == "action") {
                items = await ka.actions.list()
            }
            else if (type == "segment") {
                items = await ka.segments.list()
            }
            else if (type == "team") {
                items = await ka.teams.list()
            }
            else if (type == "project") {
                items = await ka.projects.list()
            }
            resolve(items)
        })
    }
}