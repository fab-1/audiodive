
const models = sails.hooks.sequelize.models

const stripe = sails.hooks.stripe

module.exports = async function get(req, res, next) {

    const params = req.validator([
        {clipId: 'int'},
        {donation: 'int'}
    ])

    if (!params.clipId) {
        return res.badRequest('Invalid parameters')
    }

    const clipRecord = await models.Clip.findByPk(params.clipId)

    const userId = req.me.id

    const userClip = await models.UserClip.findOne({
        where: {
            UserId: userId,
            ClipId: params.clipId,
            role: 'purchaser'
        }
    })

    if (userClip) {
        return res.status(500).send('Clip Already Purchased')
    }

    const {stripeCustomerId} = req.me

    if (!stripeCustomerId) {
        return res.status(500).send('No Stripe Account')
    }

    if (params.donation < 3) {
        return res.status(500).send('Invalid amount')
    }

    try {
        const charge = await stripe.api.charges.create({
            amount: params.donation * 100,
            currency: "usd",
            customer: stripeCustomerId
        })

        if (charge.paid) {
            await models.UserClip.create({
                ClipId: params.clipId,
                UserId: userId,
                role: 'purchaser'
            })
        }
    }
    catch (e) {
        return res.status(500).send('Billing error')
    }


    res.json({
        message: 'Success'
    })
}
