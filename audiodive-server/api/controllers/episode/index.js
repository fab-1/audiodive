module.exports = async function index(req, res) {

    const gcloud = sails.config.gcloud
    const models = sails.hooks.sequelize.models

    const recs = await models.NetworkCreators.findAll({
        attributes: ['CreatorId'],
        where: {
            NetworkId: 22
        }
    })

    const creatorIds = recs.map(rec => rec.dataValues.CreatorId)

    const feeds = await models.Feed.findAll({
        where: {
            CreatorId: creatorIds
        }
    })

    const feedsIds = feeds.map(feed => feed.id)

    const clips = await models.Clip.findAll({
        attributes: {exclude: ['config']},
        where: {
            FeedId: feedsIds
        },
        include: [{
            model: models.ClipVideo
        }]
    })

    res.json(clips.map(clip => {
        const json = clip.toJSON()
        json.ClipVideos.forEach(clipVideo => {
            clipVideo.videoUrl = gcloud.getPublicUrl(clipVideo.videoUrl)
            clipVideo.imageUrl = gcloud.getPublicUrl(clipVideo.imageUrl)
        })

        if (json.ClipVideos.length) {
            json.imageUrl = json.ClipVideos[json.ClipVideos.length - 1].imageUrl
        }

        return json
    }))
}
