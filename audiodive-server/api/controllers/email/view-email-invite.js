module.exports = {


    friendlyName: 'View manage stuff',


    description: 'Display "Manage stuff" page.',


    exits: {

        success: {
            viewTemplatePath: 'emails/email-invite-user'
        }

    },


    fn: async function () {

        // Respond with view.
        return {
            message: 'Test content ',
            inviteName: 'Fabs',
            inviteUrl: 'http://audiodive.app',
            layout: 'layouts/layout-email'
        }

    }


}
