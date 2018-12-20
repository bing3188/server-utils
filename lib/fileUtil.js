const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const multiparty = require('multiparty')
const uuid = require('uuid')
const moment = require('moment')
const mime = require('mime-types')
const qiniu = require('qiniu')
let logger = console
let config = null

const setLogger = appointLogger => {
  logger = appointLogger.createLogger(__filename)
}

const initQiniu = cfg => {
  if (!_.isEmpty(cfg)) {
    //需要填写你的 Access Key 和 Secret Key
    config = cfg
  }
}

const fileSaveLocal = (req, svpath, urlbase) => {
  return new Promise((resolve, reject) => {
    if (req.is('multipart/*')) {
      try {
        if (!fs.existsSync(svpath)) {
          let result = fs.mkdirSync(svpath, { recursive: true })
          if (result) {
            reject(result)
          }
        }
        let uploadOptions = {
          autoFields: true,
          autoFiles: true,
          uploadDir: svpath,
          maxFileSize: 10 * 1024 * 1024
        }
        let form = new multiparty.Form(uploadOptions)
        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(err)
          }
          if (files.file) {
            logger.debug(files.file[0].path)
            resolve({
              name: files.file[0].originalFilename,
              ext: path.extname(files.file[0].path),
              url: urlbase + path.basename(files.file[0].path),
              type: mime.lookup(path.extname(files.file[0].path))
            })
          } else {
            reject('no file')
          }
        })
      } catch (error) {
        reject(error)
      }
    } else {
      reject('content-type error')
    }
  })
}

const fileSaveQiniu = (req, tempDir, bucket, urlbase) => {
  return new Promise((resolve, reject) => {
    if (req.is('multipart/*')) {
      try {
        if (!fs.existsSync(tempDir)) {
          let result = fs.mkdirSync(tempDir, { recursive: true })
          if (result) {
            reject(result)
          }
        }
        let uploadOptions = {
          autoFields: true,
          autoFiles: true,
          uploadDir: tempDir,
          maxFileSize: 10 * 1024 * 1024
        }
        let form = new multiparty.Form(uploadOptions)
        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(err)
          }
          if (files.file) {
            logger.debug(files.file[0].path)
            let mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey)
            let options = {
              scope: bucket
            }
            let putPolicy = new qiniu.rs.PutPolicy(options)

            let uploadToken = putPolicy.uploadToken(mac)
            let cfg = new qiniu.conf.Config()
            let formUploader = new qiniu.form_up.FormUploader(cfg)
            let putExtra = new qiniu.form_up.PutExtra()
            let filename = moment().format('YYYY/MM/DD/') + uuid.v1().replace(/-/g, '') + path.extname(files.file[0].path)

            formUploader.putFile(uploadToken, filename, files.file[0].path, putExtra, function(respErr, respBody, respInfo) {
              if (respErr) {
                reject(respErr)
              }

              if (respInfo.statusCode == 200) {
                fs.unlinkSync(files.file[0].path)
                resolve({
                  name: files.file[0].originalFilename,
                  ext: path.extname(files.file[0].path),
                  url: urlbase + filename,
                  type: mime.lookup(path.extname(files.file[0].path))
                })
              } else {
                logger.error(respInfo.statusCode)
                logger.error(respBody)
                reject(respBody)
              }
            })
          } else {
            reject('no file')
          }
        })
      } catch (error) {
        reject(error)
      }
    } else {
      reject('content-type error')
    }
  })
}

module.exports = {
  setLogger: setLogger,
  initQiniu: initQiniu,
  fileSaveLocal: fileSaveLocal,
  fileSaveQiniu: fileSaveQiniu
}
