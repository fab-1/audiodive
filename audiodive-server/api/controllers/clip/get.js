
const models = sails.hooks.sequelize.models


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

        //if (!clip.isPremium || userClip) {
        clip.videoUrl = video.videoUrl

        clip.lastVideo = video

        delete clip.ClipVideos
    }

    if (userClip || req.me && req.me.isSuperAdmin) {
        if (userClip.role === 'purchaser') {
            clip.isPurchaser = true
        }

        if (userClip.role === 'owner') {
            clip.isOwner = true
        }

        if (userClip.role === 'contributor' || req.me.isSuperAdmin) {
            clip.isEditor = true
        }
    }
    else {
        delete clip.videoUrl
    }

    res.json(clip)
}
