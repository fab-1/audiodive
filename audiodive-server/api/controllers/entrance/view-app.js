
module.exports = async function welcomeUser(req, res) {

    if (req.me && req.me.emailStatus !== 'confirmed') {
        return res.unverified()
    }

    const models = sails.hooks.sequelize.models
    const gcloud = sails.config.gcloud

    const {originalUrl, headers, baseUrl, params} = req

    const rand = Math.floor(Math.random() * 101);
    let stylesPath = `${sails.config.custom.webpackUrl}/style.css?rand=${rand}`
    let bundlePath = `${sails.config.custom.webpackUrl}/bundle-clip.js?rand=${rand}`

    if (sails.config.environment === 'production') {
        const version = process.env.VERSION
        bundlePath = gcloud.getPublicUrl(`/beta/${version}/bundle-clip.js`)
        stylesPath = gcloud.getPublicUrl(`/beta/${version}/style.css`)
    }

    return res.view('pages/app', {
        layout: false,
        bundlePath: bundlePath,
        stylesPath: stylesPath
    })
}
