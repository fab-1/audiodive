
const models = sails.hooks.sequelize.models


module.exports = async function get(req, res) {

    const params = req.validator([{clipId: 'int'}])

    if (!params.clipId) {
        return res.badRequest('Invalid parameters')
    }


    let query = {
        where: {
            id: params.clipId
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

    if (clip) {
        await clip.destroy()
    }

    res.send('')
}
