const RequestPromise = require('request-promise')
const popularFonts = require('./popular-fonts')

module.exports = async function index(req, res) {

    const models = sails.hooks.sequelize.models

    // const creators = await AccessControl.getCreators(req)
    // const feedsIds = creators.
    // filter(creator => creator.Feed).
    // map(creator => creator.Feed.id)

    //const templates = await models.Template.findAll()
    const {userId, filter} = req.query

    try {
        const fonts = await RequestPromise.get('https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyBQdr8Z5BmLwFfkB4tveQGOp3L9qfTDynU')
        const jsonData = JSON.parse(fonts)

        let ret = jsonData.items.map(font => {
            return {
                value: font.family,
                label: font.family,
                fontFamily: font.family,
                variants: font.variants
            }
        })

        if (filter) {
            ret = ret.filter(item => popularFonts[item.label])
        }
        //let ret = []

        if (userId) {
            const customFonts = await models.CreatorAssets.findAll({
                where: {
                    type: 'font',
                    UserId: userId
                }
            })

            customFonts.forEach(font => {
                ret.unshift({
                    value: font.name,
                    label: font.name,
                    fontFamily: font.name,
                    cssUrl: `${process.env.GCLOUD_BASE_PATH}/${process.env.GCLOUD_BUCKET}/user/${userId}/font/${font.name}.css`
                })
            })
        }

        res.json(ret)
    }
    catch (e) {
        console.log(e)
        return res.badRequest('Invalid parameters')
    }
}
