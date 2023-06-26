module.exports = async function index(req, res) {

    const gcloud = sails.config.gcloud
    const models = sails.hooks.sequelize.models
    const TransferUtil = require('../../libs/transfer-util')
    const shortId = require('shortid')
    const path = require('path')
    const storage = sails.hooks.storage

    try {
        const params = req.validator([{episodeId: 'int'}])

        const episode = await models.Podcast.findOne({
            attribute: ['audioUrl', 'metaData'],
            where: {
                id: params.episodeId
            }
        })

        const destPath = `/f/${episode.FeedId}/peaks/peak-file_${episode.id}_${shortId.generate()}.json`

        const clipData = req.file('peaks')

        if (!clipData._files.length) {
            return res.badRequest('No File')
        }

        const file = clipData._files[0]
        const originalStream = file.stream

        const contentType = originalStream.headers['content-type']
        const metadata = {
            contentType
        }

        const uploadConfig = Object.assign({
            public: true,
            maxBytes: 20000000, //50MB max
            metadata,
            saveAs: destPath
        }, sails.config.gcloud)

        clipData.upload(uploadConfig, async (err, filesUploaded) => {

            if (err) return res.serverError(err)


            let {metaData} = episode
            //And update DB record
            metaData.peaksFile = destPath
            await episode.update({metaData})

            res.json(episode.toJSON())
        })

    }
    catch (err) {
        res.serverError(err)
    }

}
