
const Stripe = require('stripe')

module.exports = function (sails) {

    const stripe = Stripe(sails.config.custom.stripeSecret)

    return {

        api: stripe,

        subscribe: (customerId, stripePlan) => {

            return stripe.subscriptions.create({
                customer: customerId,
                items: [
                    {
                        plan: stripePlan,
                    },
                ],
                expand: ['latest_invoice.payment_intent'],
            })
        },


        payInvoice: (invoiceId) => {
            return stripe.invoices.pay({
                    invoice: invoiceId,
                    expand: ['payment_intent'],
                }
            )
        }

    }


}
