const rabbitmqClinet = require('./lib/rabbitmqClinet')
const websocketUtil = require('./lib/websocketUtil')
const redisClient = require('./lib/redisClient')
const authority = require('./lib/authority')

const setLogger = appointLogger => {
    rabbitmqClinet.setLogger(appointLogger)
    redisClient.setLogger(appointLogger)
    websocketUtil.setLogger(appointLogger)
    authority.setLogger(appointLogger)
}

module.exports = {
  setLogger: setLogger,
  authority: authority,
  rabbitmqClinet: rabbitmqClinet,
  redisClient: redisClient,
  websocketUtil: websocketUtil
}
