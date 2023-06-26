
const models = sails.hooks.sequelize.models

const mime = require('mime-types')

module.exports = async function update(req, res) {

    const params = req.validator([{
        clipId: 'int'
    }])

    if (!params) {
        return //res.badRequest('Invalid parameters')
    }

    const clip = await models.Clip.findByPk(params.clipId)

    if (!clip) {
        return res.notFound('This clip does not exists in this world')
    }

    await models.UserSavedClip.create({
        ClipId: params.clipId,
        UserId: req.me.id
    })

    res.json(clip.toJSON())

}
