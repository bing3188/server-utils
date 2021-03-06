const rabbitmqClinet = require('./lib/rabbitmqClinet')
const websocketUtil = require('./lib/websocketUtil')
const redisClient = require('./lib/redisClient')
const authority = require('./lib/authority')
const scheduleJob = require('./lib/scheduleJob')
const smsClient = require('./lib/smsClient')
const fileUtil = require('./lib/fileUtil')
const mongoClient = require('./lib/mongoClient')
const elasticsearchClient = require('./lib/elasticsearchClient')

const setLogger = appointLogger => {
  rabbitmqClinet.setLogger(appointLogger)
  websocketUtil.setLogger(appointLogger)
  authority.setLogger(appointLogger)
  scheduleJob.setLogger(appointLogger)
  smsClient.setLogger(appointLogger)
  fileUtil.setLogger(appointLogger)
}

module.exports = {
  setLogger: setLogger,
  authority: authority,
  rabbitmqClinet: rabbitmqClinet,
  redisClient: redisClient,
  scheduleJob: scheduleJob,
  websocketUtil: websocketUtil,
  smsClient: smsClient,
  fileUtil: fileUtil,
  mongoClient: mongoClient,
  elasticsearchClient: elasticsearchClient
}
