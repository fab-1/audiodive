
const models = sails.hooks.sequelize.models

module.exports = async function get(req, res) {

    const params = req.validator([{clipId: 'int'}])

    if (!params.clipId) {
        return res.badRequest('Invalid parameters')
    }

    const userClip = await models.UserClip.findOne({
        where: {
            UserId: req.me.id,
            ClipId: params.clipId
        }
    })

    let access = {
        isEditor: false,
        isOwner: false,
        isPurchaser: false
    }

    if (!userClip) {
        return res.json()
    }

    if (userClip.role === 'purchaser') {
        access.isPurchaser = true
    }

    if (userClip.role === 'owner') {
        access.isOwner = true
    }

    if (userClip.role === 'contributor') {
        access.isEditor = true
    }

    res.json(access)
}
