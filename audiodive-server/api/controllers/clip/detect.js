
const models = sails.hooks.sequelize.models

const {default: lightOrDarkImage} = require('@check-light-or-dark/image');
const RATIO = require('./video-ratio')

module.exports = async function get(req, res) {

    const params = req.validator([{clipId: 'int'}])

    if (!params.clipId) {
        return res.badRequest('Invalid parameters')
    }

    const UserId = req.me ? req.me.id : null

    const clipRecord = await models.Clip.findByPk(params.clipId, {
        include: [{
            model: models.ClipVideo,
            order: [['id', 'DESC']],
            limit: 1
        }, {
            model: models.UserClip,
            where: {
                UserId
            },
            required: false
        }]
    })

    const clip = clipRecord.toJSON()
    const video = clip.ClipVideos.length && clip.ClipVideos[0]
    //if this is set user is allowed to access premium
    const userClip = clip.UserClips.length && clip.UserClips[0]


    if (video) {
        clip.imageUrl = video.imageUrl
        clip.previewUrl = video.previewUrl
        clip.lastProcessed = video.updatedAt

        if (!clip.isPremium || userClip) {
            clip.videoUrl = video.videoUrl
        }

        delete clip.ClipVideos

        const key = RATIO.PARAM_TO_CONFIG[video.ratio]
        const dimension = RATIO.DIMENSIONS[key]



        const d = await lightOrDarkImage({
            image: clip.imageUrl,
            width: dimension.width,
            height: 80,
            x: 0,
            y: dimension.height - 80
        })

        return res.send(d)
    }

    res.json(clip)
}
