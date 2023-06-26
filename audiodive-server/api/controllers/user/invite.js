const validator = require('validator')
const url = require('url')
const models = sails.hooks.sequelize.models

module.exports = async function index(req, res) {

    const gcloud = sails.config.gcloud
    const models = sails.hooks.sequelize.models

    const {invitees, message, clipId} = req.body

    if (!invitees) {
        return res.badRequest('no emails provided')
    }

    let inviteUrls = {}

    try {

        for (let i = 0; i < invitees.length; i++) {
            const email = invitees[i]

            if (!validator.isEmail(email)) {
                throw 'Invalid Email'
            }

            const token = await sails.helpers.strings.random('url-friendly')
            const password = await sails.helpers.strings.random('url-friendly')

            //inviteUrl = url.resolve(sails.config.custom.baseUrl,'/signup') + '?token=' + encodeURIComponent(token)

            let record = await User.findOne({emailAddress: email})
            let inviteUrl = url.resolve(sails.config.custom.baseUrl, '/signup') + '?token=' + encodeURIComponent(token)
            let clip = null

            if (!record) {

                record = await User.create({
                    emailAddress: email,
                    inviteToken: token,
                    fullName: 'Default Name',
                    password: password,
                    inviteTokenExpiresAt: Date.now() + sails.config.custom.inviteResetTokenTTL
                }).intercept('E_UNIQUE', 'emailAlreadyInUse').fetch()


                if (clipId) {


                    let query = {
                        where: {
                            id: clipId
                        },
                        include: [{
                            model: models.ClipVideo,
                            order: [['id', 'DESC']],
                            limit: 1
                        }]
                    }

                    if (!req.me.isSuperAdmin) {
                        query.include = [{
                            model: models.UserClip,
                            where: {
                                UserId: req.me.id
                            }
                        }]
                    }

                    clip = await models.Clip.findOne(query)

                    if (!clip) {
                        return res.notFound('This clip does not exists in this world')
                    }

                    const userClip = await models.UserClip.create({
                        ClipId: clipId,
                        UserId: record.id,
                        role: 'contributor'
                    })

                    await models.UserTemplate.create({
                        TemplateId: clip.TemplateId,
                        UserId: record.id,
                        role: 'contributor'
                    })

                }

                let clipPreviewImage = null
                let clipName = clip && clip.name
                if (clip && clip.ClipVideos) {
                    clipPreviewImage = clip.ClipVideos[0].gifUrl
                }

                await sails.helpers.sendTemplateEmail.with({
                    to: email,
                    subject: `${req.me.fullName} invited you on AudioDive`,
                    template: 'email-invite-user',
                    templateData: {
                        message: message || '',
                        inviteName: req.me.fullName,
                        inviteUrl,
                        clipName,
                        clipPreviewImage,
                    }
                })

                inviteUrls[email] = inviteUrl
            }

            else {
                inviteUrls[email] = 'Already exists'
            }

        }

        res.json(inviteUrls)
    }
    catch (e) {
        console.error(e)
        return res.badRequest()
    }

}
