const _ = require('lodash')
const uuid = require('uuid')

const submainCfg = require('../submail/lib/config')
const MessageSend = require('../submail/lib/messageSend')

let logger = console

const setLogger = appointLogger => {
  logger = appointLogger.createLogger(__filename)
}

const initSms = cfg => {
  if (!_.isEmpty(cfg)) {
    submainCfg.messageConfig.appid = cfg.appid
    submainCfg.messageConfig.appkey = cfg.appkey
    submainCfg.messageConfig.signtype = cfg.signtype
  }
}

const sendMessage = (phone, message) => {
  try {
    let tag = uuid.v1().replace(/-/g, '')
    if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(phone)) {
      throw new Error('Phone error')
    }
    if (!_.isString(message) && message.length < 1) {
      throw new Error('message error')
    }
    const sender = new MessageSend()
    sender.set_to(phone)
    sender.set_content(message)
    sender.set_tag(tag)
    sender.send()
    return tag
  } catch (error) {
    logger.error(error.stack)
    throw error
  }
}

module.exports = {
  setLogger: setLogger,
  initSms: initSms,
  sendMessage: sendMessage
}
