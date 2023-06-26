module.exports = async function index(req, res) {

    const gcloud = sails.config.gcloud
    const models = sails.hooks.sequelize.models

    // const creators = await AccessControl.getCreators(req)
    // const feedsIds = creators.
    // filter(creator => creator.Feed).
    // map(creator => creator.Feed.id)

    // const recs = await models.NetworkCreators.findAll({
    //   attributes: ['CreatorId'],
    //   where: {
    //     NetworkId: 22
    //   }
    // })
    //
    // const creatorIds = recs.map(rec => rec.dataValues.CreatorId)

    const feeds = await models.Feed.findAll({
        order: [
            ['updatedAt', 'DESC']
        ],
        include: [
            {
                model: models.UserPodcast,
                where: {
                    UserId: req.me.id
                },
                required: false
            }
        ]
    })

    res.json(feeds.map(feed => feed.toJSON()))
}
