module.exports = async function upload(req, res) {

    const shortid = require('shortid')
    const storage = sails.hooks.storage
    const Feed = require('../../libs/rss-to-json')
    const TransferUtil = require('../../libs/transfer-util')

    const url = require('url')
    const models = sails.hooks.sequelize.models
    const Op = require('sequelize').Op

    const selectedPodcast = req.body

    if (!selectedPodcast || !selectedPodcast.feedUrl) {
        return res.badRequest('nope')
    }

    const itunesUrl = url.parse(selectedPodcast.collectionViewUrl).pathname

    try {

        let feed = await models.Feed.findOne({
            where: {
                itunesUrl: {[Op.like]: '%' + itunesUrl + '%'}
            }
        })

        if (feed) {
            await models.UserPodcast.create({
                FeedId: feed.id,
                UserId: req.me.id
            })

            res.json(feed)
        }
        else {
            const jsonUrl = `/f/json/${shortid.generate()}.json`

            Feed.load(selectedPodcast.feedUrl, async (err, rss) => {

                const buffer = Buffer.from(JSON.stringify(rss), 'utf-8')
                const transfer = new TransferUtil({
                    buffer
                })

                await transfer.saveToBucket(storage.bucket.file(jsonUrl), 'application/json')

                feed = await models.Feed.create({
                    name: selectedPodcast.collectionName,
                    image: selectedPodcast.artworkUrl600,
                    itunesUrl: selectedPodcast.collectionViewUrl,
                    jsonUrl,
                    rssFeedUrl: selectedPodcast.feedUrl,
                    metaData: {
                        genres: selectedPodcast.genres,
                        primaryGenreName: selectedPodcast.primaryGenreName
                    }
                })

                await models.UserPodcast.create({
                    FeedId: feed.id,
                    UserId: req.me.id
                })

                res.json(feed)
            })

        }
    }
    catch (e) {
        console.log('Already Subscribed')
    }


}
