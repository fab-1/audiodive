module.exports = async function index(req, res) {

    const gcloud = sails.config.gcloud
    const models = sails.hooks.sequelize.models
    const TransferUtil = require('../../libs/transfer-util')
    const shortId = require('shortid')
    const path = require('path')
    const storage = sails.hooks.storage
    const request = require('request-promise')

    try {

        const params = req.validator([{feedId: 'int'}])
        const guid = req.query.guid

        if (!params) {
            return
        }

        if (!guid) {
            return res.badRequest('No feed')
        }

        let episode = await models.Podcast.findOne({
            where: {
                guid: guid,
                FeedId: params.feedId
            }
        })

        if (!episode) {

            const feed = await models.Feed.findByPk(params.feedId)

            if (!feed) {
                return res.badRequest('No feed')
            }

            const jsonFeed = await request(feed.jsonUrl)

            if (!jsonFeed) {
                return res.badRequest('Invalid feed')
            }

            const jsonFeedParsed = JSON.parse(jsonFeed)

            const feedEpisode = jsonFeedParsed.items.find(episode => episode.guid === guid)

            if (!feedEpisode) {
                return res.badRequest('Invalid episode')
            }

            episode = await models.Podcast.create({
                title: feedEpisode.title,
                date: feedEpisode.created,
                description: feedEpisode.description,
                audioUrl: feedEpisode.enclosures.length && feedEpisode.enclosures[0].url,
                image: feedEpisode.itunes_image,
                guid: feedEpisode.guid,
                FeedId: params.feedId,
                metaData: {
                    duration: feedEpisode.itunes_duration
                }
            })
        }

        let peaks = null
        let audioUrl = null

        //Do we have a local version of this file?
        const storedAudio = episode.metaData && episode.metaData.storedAudio
        if (storedAudio) {

            //const [hasAudio] = await storage.bucket.exists(storedAudio)
            audioUrl = gcloud.getPublicUrl(storedAudio)


            //Did we save the peaks for this file for better UX?
            const peaksFile = episode.metaData && episode.metaData.peaksFile
            if (peaksFile) {
                const [inStorage] = await storage.bucket.exists(peaksFile)
                if (inStorage) {
                    peaks = gcloud.getPublicUrl(peaksFile)
                }
            }
        }

        res.json({
            url: audioUrl,
            peaks: peaks,
            episode: episode
        })
    }
    catch (err) {
        console.error(err)
    }
}
