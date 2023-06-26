const models = sails.hooks.sequelize.models

module.exports = async function index(req, res) {

    const params = req.validator([{templateId: 'int'}])

    if (!params.templateId) {
        return res.badRequest('Invalid parameters')
    }

    let query = {
        where: {
            id: params.templateId
        },
        include: [{
            model: models.UserTemplate
        }]
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

    res.json(template.toJSON())
}
