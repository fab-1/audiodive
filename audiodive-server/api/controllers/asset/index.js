module.exports = async function index(req, res) {

    const models = sails.hooks.sequelize.models
    const {feedId} = req.query

    let where = {
        UserId: req.me.id
    }
    if (feedId) {
        where = {
            FeedId: feedId
        }
    }

    const assets = await models.CreatorAssets.findAll({
        where,
        order: [
            ['updatedAt', 'DESC']
        ]
    })

    res.json(assets.map(asset => asset.toJSON()))
}
