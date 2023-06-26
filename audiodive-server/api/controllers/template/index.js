const { Op } = require("sequelize");

module.exports = async function index(req, res) {

    const models = sails.hooks.sequelize.models

    // const creators = await AccessControl.getCreators(req)
    // const feedsIds = creators.
    // filter(creator => creator.Feed).
    // map(creator => creator.Feed.id)

    let myTemplates = await models.Template.findAll({
        // where: {
        //     FeedId: {
        //         [Op.or]: {
        //             [Op.ne]: 1,
        //             [Op.eq]: null
        //         }
        //     }
        // },
        include: [
            {
                model: models.UserTemplate,
                where: {
                    UserId: req.me.id
                    //role:'owner'
                },
                required: true
            }
        ],
        order: [
            ['FeedId', 'DESC'],
            ['updatedAt', 'DESC'],
        ]
    })


    let {feedId} = req.query


    //these are the library templates. No need to have custom feed templates for now.
    const templates = await models.Template.findAll({
        where: {
            FeedId: 1
        }
    })

    templates.forEach(template => {

        if (!myTemplates.find(t => t.id === template.id)) {
            myTemplates.push(template)
        }

    })

    res.json(myTemplates.map(template => template.toJSON()))
}
