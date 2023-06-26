const path = require('path')
const models = sails.hooks.sequelize.models
const storage = sails.hooks.storage

module.exports = async function get(req, res) {

    const {assetId} = req.params

    if (!assetId) {
        return res.badRequest('Invalid parameters')
    }


    let query = {
        where: {
            id: assetId,
            UserId: req.me.id
        }
    }

    const asset = await models.CreatorAssets.findOne(query)

    if (asset) {

        const remoteFile = storage.bucket.file(asset.path)
        const [exists] = await remoteFile.exists()

        if (exists)
            await remoteFile.delete()

        await asset.destroy()

        res.send('asset deleted')
    }

    else {
        res.notFound('asset not found')
    }

}
