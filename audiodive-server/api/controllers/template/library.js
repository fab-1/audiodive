const models = sails.hooks.sequelize.models

module.exports = async function index(req, res) {

    const templates = await models.Template.findAll({
        where: {
            FeedId: 1
        },
        include: [
            {
                model: models.UserTemplate,
                where: {
                    UserId: req.me ? req.me.id : 0
                },
                required: false
            }
        ],
        order: [['updatedAt', 'DESC']]
    })

    res.json(templates.map(template => template.toJSON()))
}
