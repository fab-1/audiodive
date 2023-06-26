module.exports = {


    friendlyName: 'View manage stuff',


    description: 'Display "Manage stuff" page.',


    exits: {

        success: {
            viewTemplatePath: 'emails/email-verify-account'
        }

    },


    fn: async function () {

        // Respond with view.
        return {}

    }


}
