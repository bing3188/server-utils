'use strict'
const rabbitmqClinet = require('./lib/rabbitmqClinet')

const setLogger = appointLogger => {
    rabbitmqClinet.setLogger(appointLogger)
}

module.exports = {
  setLogger: setLogger,
  rabbitmqClinet: rabbitmqClinet
}
