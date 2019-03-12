const _ = require('lodash')
const genericPool = require('generic-pool')
const WebSocket = require('ws')
const url = require('url')

let logger = console

let RPCPools = {}

const setLogger = appointLogger => {
  logger = appointLogger.createLogger(__filename)
}

const genConnectionPools = rpcservers => {
  if (_.isEmpty(RPCPools) && _.isObject(rpcservers)) {
    for (let s in rpcservers) {
      const factory = {
        create: () => {
          return new Promise((resolve, reject) => {
            const ws = new WebSocket('ws://' + rpcservers[s].host + ':' + rpcservers[s].port)
            const errorHandler = error => {
              logger.error('%s connected: %s', s, error)
              reject(error)
            }

            ws.on('error', errorHandler)

            ws.on('open', () => {
              logger.info('%s connected', s)
              ws.removeListener('error', errorHandler)
              resolve(ws)
            })

            ws.on('close', (code, reason) => {
              logger.info('%s connected: %d  %s', s, code, reason)
            })
          })
        },
        destroy: client => {
          client.terminate()
        }
      }
      RPCPools[s] = {}
      RPCPools[s].pool = genericPool.createPool(factory, rpcservers[s].config)
    }
  }
}

// Message
const serverRequest = (server, url, message) => {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(RPCPools)) {
      reject('no rpc connection')
    }
    RPCPools[server].pool
      .acquire()
      .then(ws => {
        const timeoutHandle = setTimeout(() => {
          RPCPools[server].pool.destroy(ws)
          reject({
            errno: -2,
            msg: 'time out',
            info: {}
          })
        }, 5000) // 默认超时时间5s

        const errorHandler = error => {
          logger.error('%s connected: %s', ws, error)
          RPCPools[server].pool.destroy(ws)
          reject(error)
        }

        const incomingHandler = msg => {
          // logger.info(RPCPools[server].pool.available)
          // logger.info(RPCPools[server].pool.size)
          // logger.info(RPCPools[server].pool.borrowed)
          RPCPools[server].pool.release(ws)
          ws.removeListener('message', incomingHandler)
          ws.removeListener('error', errorHandler)
          clearTimeout(timeoutHandle)
          resolve(JSON.parse(msg))
        }
        ws.on('message', incomingHandler)
        ws.on('error', errorHandler)
        ws.send(JSON.stringify({ url: url, message: message }))
      })
      .catch(err => {
        // handle error - this is generally a timeout or maxWaitingClients
        // error
        logger.error(err)
        reject(err)
      })
  })
}

function heartbeat() {
  this.isAlive = true
}

const initWSServer = (ws, req, router) => {
  ws.isAlive = true

  const location = url.parse(req.url, true)
  // You might use location.query.access_token to authenticate or share sessions
  // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
  ws.authorization = location.query.authorization

  ws.on('message', async message => {
    let req = {
        WebSocket: true,
        params: {
          method: ''
        },
        body: {}
      },
      res = {
        WebSocket: true,
        errno: '0',
        msg: 'ok',
        info: {}
      }
    let request = JSON.parse(message)
    req.params.method = _.last(_.split(request.url, '/'))
    req.body = request.message
    let url = request.url.substring(0, request.url.length - req.params.method.length - 1)
    if (url in router) {
      await router[url](req, res)
    } else {
      res.errno = -1
      res.msg = 'url is not in router list'
    }
    ws.send(JSON.stringify(res))
  })

  ws.on('pong', heartbeat)

  ws.on('error', err => {
    // Ignore network errors like `ECONNRESET`, `EPIPE`, etc.
    if (err.errno) return
    throw err
  })
}

module.exports = {
  setLogger: setLogger,
  genConnectionPools: genConnectionPools,
  serverRequest: serverRequest,
  initWSServer: initWSServer
}
