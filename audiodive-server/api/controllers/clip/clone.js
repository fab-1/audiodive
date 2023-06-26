
const models = sails.hooks.sequelize.models


module.exports = async function get(req, res) {

    const params = req.validator([{clipId: 'int'}])

    if (!params.clipId) {
        return res.badRequest('Invalid parameters')
    }

    const UserId = req.me ? req.me.id : null

    const clipRecord = await models.Clip.findByPk(params.clipId)
    const clipData = clipRecord.toJSON()
    delete clipData.id
    // delete clipData.TemplateId
    // if (clipData.config.globalSettings && clipData.config.globalSettings.layoutId) {
    //     delete clipData.config.globalSettings.layoutId
    // }
    clipData.name = 'Cloned Clip'

    const record = await models.Clip.create(clipData)

    await models.UserClip.create({
        ClipId: record.id,
        UserId: req.me.id,
        role: 'owner'
    })

    res.json(record)
}
