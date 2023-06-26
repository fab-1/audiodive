module.exports = {


    friendlyName: 'View signup',


    description: 'Display "Signup" page.',

    inputs: {

        token: {
            description: 'The password reset token from the email.',
            example: '4-32fad81jdaf$329'
        },

        ref: {
            description: 'The referrer',
            example: 'test'
        }
    },

    exits: {

        success: {
            viewTemplatePath: 'pages/entrance/signup',
        },

        redirect: {
            description: 'The requesting user is already logged in.',
            responseType: 'redirect'
        },

        invalidOrExpiredToken: {
            responseType: 'expired',
            description: 'The provided token is expired, invalid, or has already been used.',
        },

        noTokenProvided: {
            viewTemplatePath: 'pages/entrance/token-input',
            description: 'The provided token is expired, invalid, or has already been used.'
        }
    },


    fn: async function (inputs) {

        // if (this.req.me) {
        //   throw {redirect: '/'};
        // }
        //

        const {session} = this.req
        //
        // if (!inputs.token && !inputs.ref) {
        //   sails.log.warn('Attempting to view new password (recovery) page, but no reset password token included in request!  Displaying error page...');
        //   throw 'noTokenProvided';
        // }

        if (inputs.token) {
            // Look up the user with this reset token.
            const userRecord = await User.findOne({inviteToken: inputs.token})

            if (!userRecord || userRecord.inviteTokenExpiresAt <= Date.now()) {
                throw 'invalidOrExpiredToken'
            }

            session.token = inputs.token
        }

        if (inputs.ref) {
            const referrer = await User.findOne({affiliateCode: inputs.ref})

            if (!referrer) {
                throw 'invalidOrExpiredToken'
            }

            session.referrerId = referrer.id
        }

        return {}

    }


}
