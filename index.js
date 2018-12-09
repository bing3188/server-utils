const rabbitmqClinet = require('./lib/rabbitmqClinet')
const websocketUtil = require('./lib/websocketUtil')

const setLogger = appointLogger => {
    rabbitmqClinet.setLogger(appointLogger)
    websocketUtil.setLogger(appointLogger)
}

module.exports = {
  setLogger: setLogger,
  rabbitmqClinet: rabbitmqClinet,
  websocketUtil: websocketUtil
}
