module.exports = async function index(req, res) {

    const gcloud = sails.config.gcloud
    const models = sails.hooks.sequelize.models
    const TransferUtil = require('../../libs/transfer-util')
    const shortId = require('shortid')
    const path = require('path')
    const storage = sails.hooks.storage
    const request = require('request-promise')

    try {

        const params = req.validator([{episodeId: 'int'}])

        if (!params) {
            return
        }

        let episode = await models.Podcast.findByPk(params.episodeId)

        if (!episode) {
            res.badRequest('Episode not valid')
        }

        //Get info from the remote mp3
        const originalUrl = episode.audioUrl.split('?')[0]
        const fileName = path.basename(originalUrl)

        //Do we have a local version of this file?
        const storedAudio = episode.metaData && episode.metaData.storedAudio
        if (storedAudio) {

            let peaks = null
            let audioUrl = null

            //Did we save the peaks for this file for better UX?
            const peaksFile = episode.metaData && episode.metaData.peaksFile
            if (peaksFile) {
                const [inStorage] = await storage.bucket.exists(peaksFile)
                if (inStorage) {
                    peaks = gcloud.getPublicUrl(peaksFile)
                }
            }

            const [isAudioReady] = await storage.bucket.exists(storedAudio)
            if (isAudioReady) {
                audioUrl = gcloud.getPublicUrl(storedAudio)
            }

            //Our job is done here
            res.json({
                url: audioUrl,
                peaks: peaks
            })

            return
        }

        //No local version? Let's store one
        let extension = path.extname(fileName)
        const destPath = `/f/${episode.FeedId}/tmpAudio/${shortId.generate()}.${extension}`

        const download = new TransferUtil({
            url: originalUrl//,
            //progress: progress => console.log(progress)
        })

        //And update DB record
        episode.metaData = episode.metaData || {}
        episode.metaData.storedAudio = destPath
        await episode.save()

        await download.saveToBucket(storage.bucket.file(destPath), 'audio/mpeg')

        console.log('saved!', destPath)

        res.json({
            url: gcloud.getPublicUrl(destPath)
        })

    }
    catch (err) {
        console.error(err)
    }
}
