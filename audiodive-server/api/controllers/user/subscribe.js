module.exports = async function (req, res) {

    const plans = sails.config.plans
    const gcloud = sails.config.gcloud
    const models = sails.hooks.sequelize.models
    const stripe = sails.hooks.stripe

    const params = req.validator([{
        planId: 'int',
        //addFriend: 'boolean',
        //clipId: 'int'
    }])

    if (!params) {
        return
    }

    const plan = plans[params.planId]
    const stripePlanId = plan.monthlyPlanId

    if (!stripePlanId) {
        return res.badRequest('Nope')
    }

    const user = await User.findOne({id: req.me.id})

    if (user.accessLevel === params.planId) {
        return res.json({status: 'already'})
    }

    //Flow for when user has failed a payment in the past
    if (user.accessLevel === 0 && !user.membershipStartedAt && user.stripeInvoiceId && user.stripeSubscriptionId && stripePlanId === user.stripePlanId) {

        try {
            const invoice = await stripe.invoices.payInvoice(user.stripeInvoiceId)

            switch (invoice.payment_intent.status) {
                case 'succeeded':

                    await User.updateOne({id: req.me.id})
                        .set({
                            accessLevel: params.planId,
                            membershipStartedAt: new Date()
                        })

                    return res.json({status: 'active'})

                default :
                    console.log('Unhandled case')
                    return res.badRequest()
            }
        }
        catch (err) {
            console.error(err)
            return res.serverError(err)
        }
    }

    try {
        const subscription = await stripe.subscribe(req.me.stripeCustomerId, stripePlanId)

        const {status} = subscription

        switch (status) {
            case 'active':

                await User.updateOne({id: req.me.id})
                    .set({
                        accessLevel: params.planId,
                        membershipStartedAt: new Date(),
                        stripeSubscriptionId: subscription.id,
                        stripeInvoiceId: subscription.latest_invoice.id,
                        stripePlanId
                    })

                return res.json({status: 'active'})

            case 'incomplete':

                await User.updateOne({id: req.me.id})
                    .set({
                        stripeSubscriptionId: subscription.id,
                        stripeInvoiceId: subscription.latest_invoice.id,
                        stripePlanId
                    })

                return res.json({status: 'incomplete'})
        }
    }
    catch (err) {
        console.error(err)
        return res.serverError(err)
    }

    res.serverError('no actions!')
}
