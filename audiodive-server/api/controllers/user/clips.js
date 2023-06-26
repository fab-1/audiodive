const Op = require('sequelize').Op

module.exports = async function index(req, res) {

    const gcloud = sails.config.gcloud
    const models = sails.hooks.sequelize.models

    let filter = {}

    const params = req.validator([{
        userId: 'int'
    }])

    if (!params) {
        return //res.badRequest('Invalid parameters')
    }

    const clips = await models.Clip.findAll({
        attributes: {exclude: ['config']},
        include: [
            {
                model: models.ClipVideo,
                where: {videoUrl: {[Op.ne]: null}}
            },
            {
                model: models.UserClip,
                where: {UserId: params.userId} //, role: 'owner'}
            }
        ]
    })

    res.json(clips.map(_clip => {
        let clip = _clip.toJSON()

        const videos = clip.ClipVideos

        if (videos.length) {
            const lastVideo = videos[videos.length - 1]
            clip.imageUrl = lastVideo.imageUrl
            clip.previewUrl = lastVideo.previewUrl

            // if (clip.isPremium) {
            //     clip.videoUrl = lastVideo.videoUrl
            // }
            //

        }

        delete clip.ClipVideos

        return clip
    }))
}
