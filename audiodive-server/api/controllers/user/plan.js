const Op = require('sequelize').Op
const sequelize = require('sequelize')
const moment = require('moment')

function getDefaultCurrentPeriod(user) {

    const membershipStartDate = moment(user.createdAt)
    const currentDate = moment()

    const diff = currentDate.diff(membershipStartDate, 'months')

    if (diff > 1) {
        return membershipStartDate.add(diff, 'month')
    }

    return membershipStartDate
}

function findAccessLevelForPlanId(plans, planId) {
    for (let accessLevel in plans) {
        const plan = plans[accessLevel]
        if (plan.monthlyPlanId === planId) {
            return accessLevel
        }
    }
}

module.exports = async function index(req, res) {

    const stripe = sails.hooks.stripe
    const PlansUtils = sails.hooks.plans
    const plans = sails.config.plans
    const models = sails.hooks.sequelize.models

    if (!req.me) {
        return res.json({
            loggedIn: false
        })
    }

    // let {userClipIds} = req.session
    //
    // if (!userClipIds) {
    //   userClipIds = req.session.userClipIds = (await models.UserClip.findAll({
    //     where: {UserId: req.me.id}
    //   })).map(userClip => userClip.ClipId)
    // }

    try {

        const {isAffiliate} = req.me

        // const {periodStart, accessLevel} = await PlansUtils.getInfos(req.me, stripe)

        const periodStart = moment()
        
        console.log('Period start', periodStart)


        //const {audioImported, videoExported} = await PlansUtils.getQuotas(req.me, periodStart)

        const audioImported = 0, videoExported = 0
        const nextCycleDate = periodStart.add(1, 'month')

        const currentPlan = plans['1']

        res.json({
            daysUntilNextCycle: moment().to(nextCycleDate),
            audioImported,
            videoExported,
            isAffiliate,
            currentPlan
        })

    }
    catch (err) {
        console.error(err)
        return res.serverError(err)
    }

}
