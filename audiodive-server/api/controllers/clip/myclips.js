module.exports = async function index(req, res) {

    const gcloud = sails.config.gcloud
    const models = sails.hooks.sequelize.models

    let filter = {}

    if (!req.me) {
        return res.forbidden()
    }

    if (!req.me.isSuperAdmin) {
        filter = {
            UserId: req.me.id,
            //role: 'owner'
        }
    }

    const clips = await models.Clip.findAndCountAll({
        limit: 20,
        offset: 0,
        attributes: {exclude: ['config']},
        order: [['id', 'DESC']],
        include: [
            {
                model: models.ClipVideo,
                order: [['id', 'DESC']],
                limit: 1
            },
            {
                model: models.UserClip,
                where: filter
            }
        ]
    })

    res.json(clips.rows.map(_clip => {
        let clip = _clip.toJSON()

        const videos = clip.ClipVideos

        if (videos.length) {
            clip.lastVideo = videos[0]
            clip.imageUrl = clip.lastVideo.imageUrl
            clip.videoUrl = clip.lastVideo.videoUrl
        }

        clip.isOwner = true

        if (req.me && req.me.isSuperAdmin) {
            clip.isEditor = true
        }

        return clip
    }))
}
