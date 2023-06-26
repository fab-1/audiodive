const { v4: uuidv4 } = require('uuid')
const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const models = sails.hooks.sequelize.models
const mime = require('mime-types')
const FONTS_EXTENSIONS = ['.eot', '.otf', '.ttf', '.woff', '.woff2']
const multer = require('multer')
const TransferUtil = require('../../libs/transfer-util')
const storage = sails.hooks.storage

const getType = (extension) => {
    if (FONTS_EXTENSIONS.indexOf(extension) !== -1) {
        return 'font'
    }

    if (extension === '.mp3') {
        return 'audio'
    }
    return 'image'
}

module.exports = async function upload(req, res) {

    const gcloud = sails.config.gcloud
    const clipData = req.file('imageData')

    if (!clipData._files.length) {
        return res.badRequest('No File')
    }


    const file = clipData._files[0]
    const originalStream = file.stream

    const params = req.validator([
        {section: 'string'}
    ])

    const showId = req.body.showId || null
    const section = params.section

    if (!params) {
        return res.badRequest('Invalid parameters')
    }

    // const show = await models.Feed.findByPk(showId)
    //
    // if (!show && showId !== -1) {
    //   return res.badRequest('Invalid Show')
    // }

    let extension = path.extname(originalStream.filename)
    const name = path.basename(originalStream.filename)
    const contentType = originalStream.headers['content-type']
    if (!extension && contentType) {
        extension = '.' + mime.extension(contentType)
    }

    const type = getType(extension)

    const filePath = `user/${req.me.id}/${uuidv4()}${extension}` //`/s/${showId}/${req.me.id}_${uuidv4()}${extension}`
    const metadata = {
        contentType
    }

    const uploadConfig = Object.assign({
        public: true,
        maxBytes: 20000000, //50MB max
        metadata,
        saveAs: filePath
    }, sails.config.gcloud)

    clipData.upload(uploadConfig, async (err, filesUploaded) => {

        if (err) return res.serverError(err)

        const record = await models.CreatorAssets.create({
            name: name,
            UserId: req.me.id,
            type: type,
            path: `/${filePath}`,
            metadata: {section: section},
            FeedId: showId
        })

        if (type === 'font') {

            const url = gcloud.getPublicUrl(filePath)
            await fs.writeFile(os.tmpdir() + '/tmp.css', `@font-face {font-family: '${name}'; src:url('${url}') format('woff2'); }`)


            // const buffer = Buffer.from(JSON.stringify(`@font-face {font-family: '${name}'; src:url('${url}') format('woff'); }`), 'utf-8')
            // const download = new TransferUtil({
            //     buffer
            //     //progress: progress => console.log(progress)
            // })
            const cssPath = `/user/${req.me.id}/font/${name}.css`
            await storage.bucket.upload(os.tmpdir() + '/tmp.css', {destination: cssPath})

            //await download.saveToBucket(storage.bucket.file(cssPath), 'text/css')
        }



        // if (data.end) {
        //   background.queueAudioCut(record.id, userId)
        // }
        //
        // if (data.audioUrl) {
        //   background.queueTranscript(record.id, userId)
        // }

        res.json(record.toJSON())
    })


}
