const models = sails.hooks.sequelize.models

module.exports = async function index(req, res) {

    const params = req.validator([{
        templateId: 'int'
    }])

    if (!params) {
        return
    }

    let query = {
        where: {
            id: params.templateId
        }
    }

    if (!req.me.isSuperAdmin) {
        query.include = [{
            model: models.UserTemplate,
            where: {
                UserId: req.me.id,
                role: 'owner'
            }
        }]
    }

    const template = await models.Template.findOne(query)

    if (!template) {
        return res.forbidden()
    }

    await template.destroy()

    res.json({deleted: true})

}
