const _ = require('lodash')
const MongoClient = require('mongodb').MongoClient
const GridFSBucket = require('mongodb').GridFSBucket
const ObjectID = require('mongodb').ObjectID

let db = null

const initMongo = cfg => {
  if (!_.isEmpty(cfg)) {
    MongoClient.connect(
      cfg.url,
      cfg.options
    ).then(client => {
      db = client.db(cfg.dbName)
    })
  }
}

const getDb = () => {
  if (db) {
    return db
  } else {
    throw new Error('mongodbClient do not connected')
  }
}

const getBucket = async bucketName => {
  if (db) {
    let bucket = new GridFSBucket(db, { bucketName: bucketName })
    return bucket
  } else {
    throw new Error('mongodbClient do not connected')
  }
}

const genObjectID = () => {
  let fileId = new ObjectID()
  return fileId
}

module.exports = {
  initMongo: initMongo,
  getDb: getDb,
  getBucket: getBucket,
  genObjectID: genObjectID
}
