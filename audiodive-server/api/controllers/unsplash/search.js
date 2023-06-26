const fetch = require('node-fetch');
global.fetch = fetch;

const createApi = require('unsplash-js').createApi;
const toJson = require('unsplash-js').toJson;
//const unsplash = new Unsplash({ accessKey: APP_ACCESS_KEY });

const unsplash = createApi({
    accessKey: process.env.UNSPLASH_API_KEY,
});

module.exports = async function search(req, res) {

    const {query, page} = req.query

    if (!query || !page) {
        return res.badRequest('missing param')
    }

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

    const photos = await unsplash.search.getPhotos({
        query: query,
        page: page,
        perPage: 30,
    });

    res.json(photos.response)
}
