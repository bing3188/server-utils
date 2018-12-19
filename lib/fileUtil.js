const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const multiparty = require('multiparty')
const uuid = require('uuid')
const mime = require('mime-types')
const qiniu = require('qiniu')
let logger = console

const setLogger = appointLogger => {
  logger = appointLogger.createLogger(__filename)
}

const initQiniu = cfg => {
  if (!_.isEmpty(cfg)) {
    //需要填写你的 Access Key 和 Secret Key
    qiniu.conf.ACCESS_KEY = cfg.ACCESS_KEY
    qiniu.conf.SECRET_KEY = cfg.SECRET_KEY
  }
}

const fileSaveLocal = (req, path, urlbase) => {
  return new Promise((resolve, reject) => {
    if (req.is('multipart/*')) {
      try {
        if (!fs.existsSync(path)) {
          let result = fs.mkdirSync(path, { recursive: true })
          if (result) {
            reject(result)
          }
        }
        let uploadOptions = {
          autoFields: true,
          autoFiles: true,
          uploadDir: path,
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

//构建上传策略函数
const uptoken = (bucket, key) => {
  var putPolicy = new qiniu.rs.PutPolicy(bucket + ':' + key)
  return putPolicy.token()
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
            let ext = path.extname(files.file[0].path)
            let filename = uuid.v1() + ext

            //生成上传 Token
            let token = uptoken(bucket, filename)

            let extra = new qiniu.io.PutExtra()
            qiniu.io.putFile(token, filename, files.file[0].path, extra, function(err, ret) {
              if (!err) {
                // 上传成功， 处理返回值
                logger.debug(ret.hash, ret.key, ret.persistentId)
                resolve({
                  name: files.file[0].originalFilename,
                  ext: path.extname(files.file[0].path),
                  url: urlbase + filename,
                  type: mime.lookup(path.extname(files.file[0].path))
                })
              } else {
                // 上传失败， 处理返回代码
                reject(err)
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
