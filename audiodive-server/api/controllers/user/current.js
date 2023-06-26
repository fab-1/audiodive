const Op = require('sequelize').Op
const sequelize = require('sequelize')
const moment = require('moment')


module.exports = async function index(req, res) {

    const gcloud = sails.config.gcloud
    const models = sails.hooks.sequelize.models

    if (!req.me) {
        return res.json({
            loggedIn: false,
            isLoggedIn: false
        })
    }


    let ret = {
        id: req.me.id,
        loggedIn: true,
        isLoggedIn: true,
        isSuperAdmin: req.me.isSuperAdmin,
        fullName: req.me.fullName,
        hasBilling: !!req.me.billingCardLast4,
        accessLevel: req.me.accessLevel,
        email: req.me.emailAddress
    }

    res.json(ret)
}
