const Op = require('sequelize').Op

module.exports = async function index(req, res) {

    const gcloud = sails.config.gcloud
    const models = sails.hooks.sequelize.models

    // const recs = await models.NetworkCreators.findAll({
    //   attributes: ['CreatorId'],
    //   where: {
    //     NetworkId: 22
    //   }
    // })
    //
    // const creatorIds = recs.map(rec => rec.dataValues.CreatorId)
    //
    // const feeds = await models.Feed.findAll({
    //   where: {
    //     CreatorId: creatorIds
    //   }
    // })
    //
    // const feedsIds = feeds.map(feed => feed.id)

    const clips = await models.Clip.findAll({
        attributes: {exclude: ['config', 'configSquare', 'configVertical', 'configWide']},
        order: [
            ['updatedAt', 'DESC']
        ],
        where: {
            name: {
                [Op.ne]: null
            }
        },
        include: [{
            model: models.ClipVideo,
            order: [['id', 'DESC']],
            limit: 1
        }, {
            model: models.UserSavedClip,
            where: {
                UserId: 3 //temporary
            }
        },
            {
                model: models.Feed,
                attributes: ['id', 'name', 'metaData']
            }]
    })

    res.json(clips.map(clip => {
        const json = clip.toJSON()

        const videos = json.ClipVideos

        if (videos.length === 1) {
            const lastVideo = videos[0]
            json.imageUrl = lastVideo.imageUrl
            json.previewUrl = lastVideo.previewUrl
            json.lastVideo = lastVideo
        }


        const feed = json.Feed

        if (feed) {
            json.Feed.categories = feed.metaData ? feed.metaData.categories : {}
            delete json.Feed.metaData
        }


        delete json.ClipVideos
        delete json.UserSavedClips

        if (req.me && req.me.isSuperAdmin) {
            json.isOwner = true
        }

        return json
    }))
}
