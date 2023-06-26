const models = sails.hooks.sequelize.models


module.exports = async function index(req, res) {

    const params = req.validator([{
        name: 'string',
        FeedId: 'int'
    }])

    if (!params) {
        return
    }

    const {configWide, configSquare, configVertical} = req.body
    const {FeedId, name} = params

    const created = await models.Template.create({FeedId, name, configWide, configSquare, configVertical})

    await models.UserTemplate.create({
        TemplateId: created.id,
        UserId: req.me.id,
        role: 'owner'
    })

    res.json(created.toJSON())

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
