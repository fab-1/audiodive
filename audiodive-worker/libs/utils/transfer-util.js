const StorageUtil = require('./storage-util')
const rp = require('request-promise')
const fs = require('fs')
const request = require('request')

class TransferUtil {

    constructor(opt = {}) {

        this.url = opt.url
        this.path = opt.path
        this.buffer = opt.buffer
        this.bytesSaved = 0
        this.contentLength = 0
        this.progressHandler = opt.progress
    }

    saveToDisk(path) {

        return new Promise(async (fulfill, reject) => {

            const outputStream = fs.createWriteStream(path)

            outputStream.on('error', (err) => {
                reject(err)
            })

            outputStream.on('finish', () => {
                fulfill(path)
            })

            if (this.url) {
                const headers = await rp.head(this.url)
                this.contentLength = headers['content-length']
                const inputStream = this.getInputStream()
                inputStream && inputStream.pipe(outputStream)
            }

            if (this.buffer) {
                outputStream.end(this.buffer)
            }
        })

    }

    getInputStream() {

        let inputStream = null

        if (this.url) {
            inputStream = request(this.url)
        }

        if (this.path) {
            inputStream = fs.createReadStream(this.path)
        }

        if (!inputStream) {
            return null
        }

        inputStream.on('data', chunk => {
            this.bytesSaved += chunk.length
            if (this.contentLength && this.progressHandler) {
                this.progressHandler(this.bytesSaved / this.contentLength)
            }
        })

        return inputStream
    }

    saveToBucket(path, contentType = 'video/mp4') {

        return new Promise(async (fulfill, reject) => {

            const file = StorageUtil.bucket.file(path, { gzip: true })

            const outputStream = file.createWriteStream({
                metadata: { contentType },
                gzip: true
            })

            outputStream.on('error', (err) => {
                reject(err)
            })

            outputStream.on('finish', () => {
                console.log('saveToBucket', path)
                fulfill(StorageUtil.getPublicUrl(path))
            })

            if (this.url) {
                const headers = await rp.head(this.url)
                this.contentLength = headers['content-length']
            }

            if (this.path) {
                const stats = fs.statSync(this.path)
                this.contentLength = stats["size"]
            }

            if (this.buffer) {
                outputStream.end(this.buffer)
            }
            else {
                this.getInputStream().pipe(outputStream)
            }

        })
    }
}

module.exports = TransferUtil