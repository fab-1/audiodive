
const models = sails.hooks.sequelize.models

const mime = require('mime-types')

module.exports = async function update(req, res) {

    const params = req.validator([{
        ClipId: 'int'
    }])

    if (!params) {
        return //res.badRequest('Invalid parameters')
    }

    const {ClipId} = params
    const {invitees} = req.body





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

            if (!record) {

                record = await User.create({
                    emailAddress: email,
                    inviteToken: token,
                    fullName: 'Default Name',
                    password: password,
                    inviteTokenExpiresAt: Date.now() + sails.config.custom.inviteResetTokenTTL
                }).intercept('E_UNIQUE', 'emailAlreadyInUse').fetch()


                if (clipId && validator.isInt(clipId)) {
                    await models.UserClip.create({
                        ClipId: clipId,
                        UserId: record.id,
                        role: 'contributor'
                    })
                }

                await sails.helpers.sendTemplateEmail.with({
                    to: email,
                    subject: `${req.me.fullName} invited you on AudioDive`,
                    template: 'email-invite-user',
                    templateData: {
                        message: params.message,
                        inviteName: req.me.fullName,
                        inviteUrl
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

    /* todo us ACL for preventing update instead */
    const clip = await models.Clip.findOne(query)

    if (!clip) {
        return res.notFound('This clip does not exists in this world')
    }

    await models.UserClip.create({
        ClipId: ClipId,
        UserId: UserId,
        role: 'contributor'
    })

    await models.UserTemplate.create({
        TemplateId: clip.TemplateId,
        UserId: UserId,
        role: 'contributor'
    })

    res.json({})
}
