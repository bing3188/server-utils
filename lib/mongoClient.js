const _ = require('lodash')
const MongoClient = require('mongodb').MongoClient
const GridFSBucket = require('mongodb').GridFSBucket
const ObjectID = require('mongodb').ObjectID

// const syslogger = require('./logger').createLogger(__filename)
let logger = console.out
let db = null

const setLogger = appointLogger => {
  logger = appointLogger.createLogger(__filename)
}

const initMongo = config => {
  if (!_.isEmpty(config.mysql)) {
    MongoClient.connect(
      config.url,
      config.options
    ).then(client => {
      db = client.db(mongo.dbName)
    })
  }
}

const getDb = () => {
  return db
}

const getBucket = async config => {
  let db = await getDb()
  let bucket = new GridFSBucket(db, { bucketName: config.mongo.bucketName })
  return bucket
}

const genObjectID = () => {
  let fileId = new ObjectID()
  return fileId
}

module.exports = {
  setLogger: setLogger,
  initMongo: initMongo,
  getDb: getDb,
  getBucket: getBucket,
  genObjectID: genObjectID
}
