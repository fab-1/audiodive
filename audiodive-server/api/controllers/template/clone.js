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

    const template = await models.Template.findOne(query)

    // if (template.FeedId === 1) {
    //     delete template.FeedId
    //     template.name = "Clone of " + template.name
    // }
    // else {
    //     return res.sendCode(403)
    // }

    delete template.id

    const clone = await models.Template.create(template)

    const userTemplate = await models.UserTemplate.create({
        TemplateId: clone.id,
        UserId: req.me.id,
        role: 'owner'
    })

    let clonedTemplate = clone.toJSON()
    clonedTemplate.UserTemplates = [userTemplate.toJSON()]


    // const created = await models.Template.create({FeedId, name, configWide, configSquare, configVertical})
    //
    // await models.UserTemplate.create({
    //     TemplateId: created.id,
    //     UserId: req.me.id,
    //     role: 'owner'
    // })

    res.json(clonedTemplate.toJSON())

//   const data = req.body.template
//
//   const recordData = {
//     id: data.id,
//     name: data.name,
//     configWide: data.configWide,
//     configSquare: data.configSquare,
//     configVertical: data.configVertical,
//     FeedId: data.FeedId,
//     CreatorId: req.user.id
//   }
//
// //if admin, we use the default creator for that podcast
//   if (req.user.isAdmin && data.FeedId) {
//     recordData.CreatorId = await AccessControl.getCreatorIdFromFeedId(data.FeedId)
//   }
//
//   const created = await createOrUpdate(recordData)
//   const clip = created.toJSON?created.toJSON():data
//
//   res.json({
//     record: clip,
//     isNew: !data.id
//   })
//
//   const template = await models.Template.findByPk(params.templateId)

}
