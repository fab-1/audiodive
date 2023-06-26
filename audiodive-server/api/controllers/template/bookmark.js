
const models = sails.hooks.sequelize.models

module.exports = async function update(req, res) {

    const params = req.validator([{
        templateId: 'int'
    }])

    if (!params) {
        return //res.badRequest('Invalid parameters')
    }

    const template = await models.Template.findByPk(params.templateId)

    if (!template) {
        return res.notFound('This clip does not exists in this world')
    }

    await models.UserSavedClip.create({
        TemplateId: params.templateId,
        UserId: req.me.id
    })

    res.json(template.toJSON())

}
