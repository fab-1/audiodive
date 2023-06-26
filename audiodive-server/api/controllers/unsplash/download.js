const fetch = require('node-fetch');
global.fetch = fetch;

const models = sails.hooks.sequelize.models
const { v4: uuidv4 } = require('uuid')
const createApi = require('unsplash-js').createApi;
const toJson = require('unsplash-js').toJson;
const TransferUtil = require('../../libs/transfer-util')
const storage = sails.hooks.storage

const unsplash = createApi({
    accessKey: process.env.UNSPLASH_API_KEY,
});

const truncate = (input) => input.length > 200 ? `${input.substring(0, 200)}...` : input;

module.exports = async function search(req, res) {

    const {id} = req.body

    if (!id) {
        return res.badRequest('missing param')
    }

    const apires = await unsplash.photos.get({
        photoId: id,
    });

    const photo = apires.response

    await unsplash.photos.trackDownload({
        downloadLocation: photo.links.download_location,
    });

    const download = new TransferUtil({
        url: photo.urls.regular//,
        //progress: progress => console.log(progress)
    })

    const filePath = `user/${req.me.id}/${uuidv4()}.jpg`
    await download.saveToBucket(storage.bucket.file(filePath), 'image/jpeg', true)

    const name = photo.description || photo.alt_description || 'new photo'

    const record = await models.CreatorAssets.create({
        name: truncate(name),
        UserId: req.me.id,
        type: 'image',
        path: `/${filePath}`,
        metadata: {section: 'clip'},
        FeedId: null
    })

    res.json(record.toJSON())
}
