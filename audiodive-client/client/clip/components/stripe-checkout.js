const checkout = (email) => {
    return new Promise((resolve, reject) => {
        try {

            let hasTriggeredTokenCallback
            const checkoutHandler = window.StripeCheckout.configure({
                key: window.stripePublishableKey
            })

            // Open Stripe checkout.
            // (https://stripe.com/docs/checkout#integration-custom)
            checkoutHandler.open({
                name: 'AudioDive',
                description: 'Link your credit card.',
                panelLabel: 'Save card',
                email: email,//« So that Stripe doesn't prompt for an email address
                locale: 'auto',
                zipCode: false,
                allowRememberMe: false,
                closed: () => {
                    // If the Checkout dialog was cancelled, resolve undefined.
                    if (!hasTriggeredTokenCallback) {
                        resolve();
                    }
                },
                token: (stripeData) => {

                    // After payment info has been successfully added, and a token
                    // was obtained...
                    hasTriggeredTokenCallback = true;

                    // Normalize token and billing card info from Stripe and resolve
                    // with that.
                    let stripeToken = stripeData.id;
                    let billingCardLast4 = stripeData.card.last4;
                    let billingCardBrand = stripeData.card.brand;
                    let billingCardExpMonth = String(stripeData.card.exp_month);
                    let billingCardExpYear = String(stripeData.card.exp_year);

                    resolve({
                        stripeToken,
                        billingCardLast4,
                        billingCardBrand,
                        billingCardExpMonth,
                        billingCardExpYear
                    });
                }//Œ
            });
        } catch (err) {
            reject(err);
        }
    })
}

export default checkout