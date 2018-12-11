const rabbitmqClinet = require('./lib/rabbitmqClinet')
const websocketUtil = require('./lib/websocketUtil')
const redisClient = require('./lib/redisClient')
const authority = require('./lib/authority')
const scheduleJob = require('./lib/scheduleJob')
const mongoClient = require('./lib/mongoClient')
const elasticsearchClient = require('./lib/elasticsearchClient')
const mysqlClient = require('./lib/mysqlClient')

const setLogger = appointLogger => {
  rabbitmqClinet.setLogger(appointLogger)
  redisClient.setLogger(appointLogger)
  websocketUtil.setLogger(appointLogger)
  authority.setLogger(appointLogger)
  scheduleJob.setLogger(appointLogger)
  mongoClient.setLogger(appointLogger)
  mysqlClient.setLogger(appointLogger)
}

module.exports = {
  setLogger: setLogger,
  authority: authority,
  rabbitmqClinet: rabbitmqClinet,
  redisClient: redisClient,
  scheduleJob: scheduleJob,
  websocketUtil: websocketUtil,
  mongoClient: mongoClient,
  elasticsearchClient: elasticsearchClient,
  mysqlClient: mysqlClient
}
