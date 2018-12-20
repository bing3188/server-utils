const _ = require('lodash')
const elasticsearch = require('elasticsearch')
let client = null

const initElasticsearch = cfg => {
  if (!_.isEmpty(cfg)) {
    client = new elasticsearch.Client({
      host: cfg.host,
      log: cfg.log
    })
  }
}

const getClient = () => {
  return client
}

module.exports = {
  initElasticsearch: initElasticsearch,
  getClient: getClient
}
