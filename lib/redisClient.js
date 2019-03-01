const Redis = require('ioredis')

let client = null

const initClient = config => {
  if (config.redis.cluster) {
    client = new Redis.Cluster(config.redis.cluster)
  } else {
    client = new Redis({
      port: config.redis.port, // Redis port
      host: config.redis.host, // Redis host
      db: 0
    })
  }
}

/**
 * 设置缓存
 * @param key 缓存key
 * @param value 缓存value
 * @param expired 缓存的有效时长，单位秒
 */
const set = (key, value, expired) => {
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
const get = key => {
  return new Promise((resolve, reject) => {
    client.get(key, function(err, reply) {
      if (err) {
        reject(err)
      }
      resolve(JSON.parse(reply))
    })
  })
}

const hset = (key, field, value, expired) => {
  return new Promise((resolve, reject) => {
    client.hset(key, field, JSON.stringify(value), err => {
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

const hgetall = key => {
  return new Promise((resolve, reject) => {
    client.hgetall(key, (err, reply) => {
      if (err) {
        reject(err)
      }
      resolve(reply)
    })
  })
}

const hget = (key, field) => {
  return new Promise((resolve, reject) => {
    client.hget(key, field, (err, reply) => {
      if (err) {
        reject(err)
      }
      resolve(JSON.parse(reply))
    })
  })
}

const hdel = (key, fields) => {
  return new Promise((resolve, reject) => {
    client.hdel(key, fields, err => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

/**
 * 移除缓存
 * @param key 缓存key
 * @param callback 回调函数
 */
const del = key => {
  return new Promise((resolve, reject) => {
    client.del(key, err => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

const ttl = key => {
  return new Promise((resolve, reject) => {
    client.ttl(key, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

const incr = key => {
  return new Promise((resolve, reject) => {
    client.incr(key, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

module.exports = {
  initClient: initClient,
  set: set,
  get: get,
  hget: hget,
  hgetall: hgetall,
  hset: hset,
  hdel: hdel,
  del: del,
  ttl: ttl,
  incr: incr
}
