const models = sails.hooks.sequelize.models

module.exports = async function index(req, res) {

    const params = req.validator([{
        name: 'string',
        templateId: 'int'
    }])

    if (!params) {
        return
    }

    const {name, configWide, configSquare, configVertical, FeedId} = req.body

    let query = {
        where: {
            id: params.templateId
        }
    }

    if (!req.me.isSuperAdmin) {
        query.include = [{
            model: models.UserTemplate,
            where: {
                UserId: req.me.id
            }
        }]
    }

    const template = await models.Template.findOne(query)

    if (!template) {
        return res.forbidden()
    }

    await template.update({
        name,
        configWide,
        configSquare,
        configVertical,
        FeedId
    })

    res.json(template.toJSON())

}
