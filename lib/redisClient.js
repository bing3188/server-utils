const redis = require('redis-connection-pool')

let client = null

const initClient = config => {
  client = redis('myRedisPool', {
    host: config.redis.host, // default
    port: config.redis.port, //default
    // optionally specify full redis url, overrides host + port properties
    // url: "redis://username:password@host:port"
    max_clients: 30, // defalut
    perform_checks: false, // checks for needed push/pop functionality
    database: 0, // database number to use
    options: config.redis.opts
  })
}

/**
 * 设置缓存
 * @param key 缓存key
 * @param value 缓存value
 * @param expired 缓存的有效时长，单位秒
 */
const setItem = async (key, value, expired) => {
  return new Promise((resolve, reject) => {
    client.set(key, JSON.stringify(value), err => {
      if (err) {
        reject(err)
      }
      if (expired) {
        client.expire(key, expired, err => {
          if (err) {
            reject(err)
          }
          resolve()
        })
      } else {
        resolve()
      }
    })
  })
}

/**
 * 获取缓存
 * @param key 缓存key
 */
const getItem = async key => {
  return new Promise((resolve, reject) => {
    client.get(key, function(err, reply) {
      if (err) {
        reject(err)
      }
      resolve(JSON.parse(reply))
    })
  })
}

/**
 * 移除缓存
 * @param key 缓存key
 * @param callback 回调函数
 */
const removeItem = async key => {
  return new Promise((resolve, reject) => {
    client.del(key, err => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

module.exports = {
  initClient: initClient,
  setItem: setItem,
  getItem: getItem,
  removeItem: removeItem
}
