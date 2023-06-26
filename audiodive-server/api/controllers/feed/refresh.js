
const shortid = require('shortid')
const models = sails.hooks.sequelize.models

const storage = sails.hooks.storage
const Feed = require('../../libs/rss-to-json')
const TransferUtil = require('../../libs/transfer-util')

module.exports = async function get(req, res) {

    const params = req.validator([{feedId: 'int'}])

    if (!params.feedId) {
        return res.badRequest('Invalid parameters')
    }

    const feed = await models.Feed.findOne({
        where: {
            id: params.feedId //,CreatorId: creatorIds
        }
    })

    const jsonUrl = `/f/json/${shortid.generate()}.json`

    Feed.load(feed.rssFeedUrl, async (err, rss) => {

        const buffer = Buffer.from(JSON.stringify(rss), 'utf-8')
        const transfer = new TransferUtil({
            buffer
        })

        await transfer.saveToBucket(storage.bucket.file(jsonUrl), 'application/json')

        await feed.update({
            jsonUrl
        })

        const feedJSON = feed.toJSON()

        res.json(feedJSON)

    })


    // const episodes = await models.Podcast.findAll({
    //   attributes: ['id', ['image', 'imageUrl'],  'audioUrl',  'date',  'title', ['title', 'name'],  'description', 'guid'],
    //   where: {FeedId: params.feedId, type: 'episode'},
    //   order: [['date','DESC']]
    // })

    //feedJSON.episodes = episodes.map(episode => episode.toJSON())


}
