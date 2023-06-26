const Op = require('sequelize').Op

module.exports = async function index(req, res) {

    const models = sails.hooks.sequelize.models

    // const creators = await AccessControl.getCreators(req)
    // const feedsIds = creators.
    // filter(creator => creator.Feed).
    // map(creator => creator.Feed.id)

    const users = await models.User.findAll({
        attributes: ['id', 'fullName', 'lastSeenAt'],
        where: {
            tosAcceptedByIp: {[Op.ne]: ''}
        },
        order: [
            ['lastSeenAt', 'ASC']
        ]
    })

    res.json(users.map(user => {
            const json = user.toJSON()
            return {
                id: json.id,
                name: json.fullName,
                lastSeenAt: new Date(json.lastSeenAt)
            }
        })
    )
}
