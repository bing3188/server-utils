const _ = require('lodash')
const Sequelize = require('sequelize')

// const logger = require('./logger').createLogger(__filename)
const elaClient = require('./elasticsearchClient.js').client
const MongoCli = require('./mongoClient')

let logger = console.out
let sequelize = null
let sequelizeQuery = null
let elkIndex = ''

const setLogger = appointLogger => {
  logger = appointLogger.createLogger(__filename)
}

const initMysql = config => {
  logger.debug('init mysql...')
  if (_.isEmpty(config.normal)) {
    logger.error('please make the mysql configure')
    return
  } else {
    sequelize = new Sequelize(config.normal.database, config.normal.username, config.normal.password, {
      host: config.normal.host,
      port: config.normal.port,
      dialect: 'mysql',
      timezone: '+08:00', //东八时区
      pool: {
        max: 5, // max
        min: 0, // min
        idle: 10000 //10 seconds
      },
      retry: {
        match: 'getaddrinfo ENOTFOUND',
        max: 3
      },
      logging: sql => {
        logger.debug(sql)
      }
    })
  }
  if (!_.isEmpty(config.readonly)) {
    sequelizeQuery = new Sequelize(config.readonly.database, config.readonly.username, config.readonly.password, {
      host: config.readonly.host,
      port: config.readonly.port,
      dialect: 'mysql',
      timezone: '+08:00', //东八时区
      pool: {
        max: 5, // max
        min: 0, // min
        idle: 10000 //10 seconds
      },
      retry: {
        match: 'getaddrinfo ENOTFOUND',
        max: 3
      },
      logging: function(sql) {
        logger.debug(sql)
      }
    })
  }
  if (!_.isNull(elaClient)) {
    elkIndex = config.elasticsearch.index
  }
}

// let sequelize = new Sequelize(config.sequelize.database, config.sequelize.username, config.sequelize.password, {
//   host: config.sequelize.host,
//   port: config.sequelize.port,
//   dialect: config.sequelize.dialect,
//   timezone: '+08:00', //东八时区
//   pool: {
//     max: 5, // max
//     min: 0, // min
//     idle: 10000 //10 seconds
//   },
//   retry: {
//     match: 'getaddrinfo ENOTFOUND',
//     max: 3
//   },
//   logging: function(sql) {
//     logger.debug(sql)
//   }
// })

const defineModel = (name, attributes, params) => {
  let attrs = {}
  let tbpara = arguments[2] ? params : {}

  for (let key in attributes) {
    let value = attributes[key]
    if (typeof value === 'object' && value['type']) {
      value.allowNull = value.allowNull || false
      attrs[key] = value
    } else {
      attrs[key] = {
        type: value,
        allowNull: false
      }
    }
  }

  attrs.state = {
    type: Sequelize.STRING(5),
    defaultValue: '1'
  }

  attrs.version = {
    type: Sequelize.BIGINT,
    defaultValue: 0,
    allowNull: false
  }
  // console.log('model defined for table: ' + name + '\n' + JSON.stringify(attrs, function(k, v) {
  //     if (k === 'type') {
  //         for (let key in Sequelize) {
  //             if (key === 'ABSTRACT' || key === 'NUMBER') {
  //                 continue;
  //             }
  //             let dbType = Sequelize[key];
  //             if (typeof dbType === 'function') {
  //                 if (v instanceof dbType) {
  //                     if (v._length) {
  //                         return `${dbType.key}(${v._length})`;
  //                     }
  //                     return dbType.key;
  //                 }
  //                 if (v === dbType) {
  //                     return dbType.key;
  //                 }
  //             }
  //         }
  //     }
  //     return v;
  // }, '  '));
  return sequelize.define(
    name,
    attrs,
    Object.assign(
      {
        tableName: name,
        timestamps: true,
        underscored: true,
        hooks: {
          beforeValidate: obj => {
            if (obj.isNewRecord) {
              logger.debug('will create entity...' + obj)
              obj.version = 0
            } else {
              logger.debug('will update entity...')
              obj.version++
            }
          },
          afterCreate: async obj => {
            try {
              let jsonObj = JSON.parse(JSON.stringify(obj))
              if (obj.constructor.tableName === 'tbl_common_user') {
                delete jsonObj.password
              }
              if (!_.isNull(elaClient)) {
                elaClient
                  .create({
                    index: elkIndex + '-' + obj.constructor.tableName,
                    type: 'table',
                    id: obj[obj.constructor.primaryKeyField],
                    body: jsonObj
                  })
                  .then(
                    function() {},
                    function(err) {
                      logger.error(err)
                    }
                  )
              }

              let db = MongoCli.getDb()
              if (!_.isNull(db)) {
                let collection = db.collection(obj.constructor.tableName)
                await collection.insertOne(jsonObj)
              }
            } catch (error) {
              logger.error(error)
            }
          },
          afterUpdate: async obj => {
            try {
              let jsonObj = JSON.parse(JSON.stringify(obj))
              if (obj.constructor.tableName === 'tbl_common_user') {
                delete jsonObj.password
              }
              if (!_.isNull(elaClient)) {
                elaClient
                  .index({
                    index: elkIndex + '-' + obj.constructor.tableName,
                    type: 'table',
                    id: obj[obj.constructor.primaryKeyField],
                    body: jsonObj
                  })
                  .then(
                    function() {},
                    function(err) {
                      logger.error(err)
                    }
                  )
              }

              let db = MongoCli.getDb()
              if (!_.isNull(db)) {
                let collection = db.collection(obj.constructor.tableName)
                let key = obj.constructor.primaryKeyField
                let queryCondition = {}
                queryCondition[key] = obj[key]

                await collection.updateOne(queryCondition, { $set: jsonObj })
              }
            } catch (error) {
              logger.error(error)
            }
          }
        }
      },
      tbpara
    )
  )
}

const TYPES = ['STRING', 'INTEGER', 'BIGINT', 'TEXT', 'DOUBLE', 'DATEONLY', 'DATE', 'BOOLEAN', 'UUID', 'UUIDV1']

let exp = {
  setLogger: setLogger,
  initMysql: initMysql,
  defineModel: defineModel,
  sequelize: sequelize,
  sequelizeQuery: sequelizeQuery,
  Op: Sequelize.Op,
  ID: Sequelize.STRING(30),
  IDNO: Sequelize.BIGINT,
  sync: () => {
    // only allow create ddl in non-production environment:
    if (process.env.NODE_ENV !== 'production') {
      return sequelize.sync({
        alter: true
      })
    } else {
      throw new Error("Cannot sync() when NODE_ENV is set to 'production'.")
    }
  }
}

for (let type of TYPES) {
  exp[type] = Sequelize[type]
}

module.exports = exp
