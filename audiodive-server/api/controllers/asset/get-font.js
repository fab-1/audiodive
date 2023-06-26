module.exports = async function index(req, res) {

    const models = sails.hooks.sequelize.models
    const {fontName} = req.query

    if (!fontName) {
        res.status(500).send('Invalid')
    }

    const asset = await models.CreatorAssets.findOne({
        attributes: ['UserId', 'name'],
        where: {
            name: fontName
        }
    })

    if (!asset) {
        return res.json(null)
    }

    res.json({
        cssUrl: `${process.env.GCLOUD_BASE_PATH}/${process.env.GCLOUD_BUCKET}/user/${asset.UserId}/font/${asset.name}.css`,
        fontFamily: asset.name
    })
}
