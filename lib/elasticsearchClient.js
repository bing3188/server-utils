const _ = require('lodash')
const elasticsearch = require('elasticsearch')
let client = null

const initElasticsearch = config => {
  if (!_.isEmpty(config)) {
    client = new elasticsearch.Client({
      host: config.host,
      log: config.log
    })
  }
}

module.exports = {
  initElasticsearch: initElasticsearch,
  client: client
}
