
const models = sails.hooks.sequelize.models

const stripe = sails.hooks.stripe

module.exports = async function get(req, res, next) {

    const params = req.validator([
        {clipId: 'int'}
    ])

    if (!params.clipId) {
        return res.badRequest('Invalid parameters')
    }

    const clipRecord = await models.Clip.findByPk(params.clipId)

    const userId = req.me.id

    const {stripeCustomerId} = req.me

    if (!stripeCustomerId) {
        return res.status(500).send('No Stripe Account')
    }

    try {
        const charge = await stripe.api.charges.create({
            amount: 2 * 100,
            currency: "usd",
            customer: stripeCustomerId
        })

        clipRecord.update({unlocked: true})
    }
    catch (e) {
        return res.status(500).send('Billing error')
    }

    res.json({
        message: 'Success'
    })
}
