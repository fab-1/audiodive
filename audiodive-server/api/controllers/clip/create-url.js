const { v4: uuidv4 } = require('uuid')
const path = require('path')
const models = sails.hooks.sequelize.models
const mime = require('mime-types')
const PlansUtils = sails.hooks.plans
const plans = sails.config.plans
const storage = sails.hooks.storage

module.exports = async (req, res) => {

    try {
        const params = req.validator(['fileName'])
        let extension = path.extname(params.fileName)
        const name = path.basename(params.fileName)
        const mimeType = mime.lookup(params.fileName)

        const options = {
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType: mimeType,
            Method: 'PUT'
        };

        const filePath = `s/0/${req.me.id}_${uuidv4()}${extension}`

        // Get a v4 signed URL for uploading file
        const [url] = await storage.bucket.file(filePath)
            .getSignedUrl(options)

        res.json({
            url,
            mimeType
        })

    }
    catch(e) {
        console.log(e)
        res.send('error')
    }


}
