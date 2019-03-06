const _ = require('lodash')
const uuid = require('uuid')

const submainCfg = require('./submail/lib/config')
const MessageSend = require('./submail/lib/messageSend')
const MessageXSend = require('./submail/lib/messageXSend')

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
    if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(phone)) {
      throw new Error('Phone error')
    }
    if (!_.isString(message) && message.length < 1) {
      throw new Error('message error')
    }
    const tag = uuid.v1().replace(/-/g, '')
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

// args example {
//     code: '8888888'
// }
const sendMessageByTemplate = (phone, template, args) => {
  try {
    if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(phone)) {
      throw new Error('Phone error')
    }
    if (!_.isString(template)) {
      throw new Error('template error')
    }
    if (!_.isObject(args)) {
      throw new Error('args error')
    }
    const tag = uuid.v1().replace(/-/g, '')
    const sender = new MessageXSend()
    sender.set_to(phone)
    sender.set_project(template)
    for (let key in args) {
      sender.add_var(key, args[key])
    }
    sender.set_tag(tag)
    sender.xsend()
    return tag
  } catch (error) {
    logger.error(error.stack)
    throw error
  }
}

module.exports = {
  setLogger: setLogger,
  initSms: initSms,
  sendMessage: sendMessage,
  sendMessageByTemplate: sendMessageByTemplate
}
