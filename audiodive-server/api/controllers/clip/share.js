
const models = sails.hooks.sequelize.models
const mime = require('mime-types')

module.exports = async function update(req, res) {

    const params = req.validator([{
        ClipId: 'int',
        UserId: 'int'
    }])

    if (!params) {
        return //res.badRequest('Invalid parameters')
    }

    const {ClipId, UserId} = params

    let query = {
        where: {
            id: ClipId
        }
    }

    if (!req.me.isSuperAdmin) {
        query.include = [{
            model: models.UserClip,
            where: {
                UserId: req.me.id
            }
        }]
    }

    /* todo us ACL for preventing update instead */
    const clip = await models.Clip.findOne(query)

    if (!clip) {
        return res.notFound('This clip does not exists in this world')
    }

    await models.UserClip.create({
        ClipId: ClipId,
        UserId: UserId,
        role: 'contributor'
    })

    await models.UserTemplate.create({
        TemplateId: clip.TemplateId,
        UserId: UserId,
        role: 'contributor'
    })

    res.json({})
}
