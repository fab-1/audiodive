const Stripe = require('stripe')
const moment = require('moment')
const Op = require('sequelize').Op
const sequelize = require('sequelize')

module.exports = function (sails) {


    const getDefaultCurrentPeriod = (user) => {

        const membershipStartDate = moment(user.createdAt)
        const currentDate = moment()

        const diff = currentDate.diff(membershipStartDate, 'months')

        if (diff > 1) {
            return membershipStartDate.add(diff, 'month')
        }

        return membershipStartDate
    }

    const findAccessLevelForPlanId = (plans, planId) => {
        for (let accessLevel in plans) {
            const plan = plans[accessLevel]
            if (plan.monthlyPlanId === planId) {
                return accessLevel
            }
        }
    }

    return {

        getInfos: async (user, stripeApi) => {

            const plans = sails.config.plans

            return new Promise(async (resolve, reject) => {

                const {stripeSubscriptionId} = user

                let periodStart = getDefaultCurrentPeriod(user)
                let accessLevel = user.accessLevel

                if (stripeSubscriptionId) {
                    const sub = await sails.hooks.stripe.api.subscriptions.retrieve(stripeSubscriptionId)

                    //was the sub ended?
                    if (sub.ended_at && moment.unix(sub.current_period_end).isBefore(moment())) {
                        //no active plan
                    }
                    else {
                        // if there is still a sub, need to grab the correct access level
                        accessLevel = findAccessLevelForPlanId(plans, sub.plan.id)
                        periodStart = moment.unix(sub.current_period_start)
                    }

                }

                resolve({
                    accessLevel,
                    periodStart
                })

            })


        },

        getQuotas: (user, periodStart) => {

            const models = sails.hooks.sequelize.models

            return new Promise(async (resolve, reject) => {

                let audioImported = 0, videoExported = 0

                const clips = await models.Clip.findAll({
                    attributes: ['id', 'totalDuration'],
                    where: {
                        UserId: user.id,
                        createdAt: {[Op.gte]: periodStart.format()}
                    },
                    include: [models.ClipVideo]
                })

                clips.forEach(clip => {
                    audioImported += clip.totalDuration
                    if (clip.ClipVideos.length) {
                        videoExported += clip.totalDuration
                    }
                })

                resolve({
                    audioImported,
                    videoExported
                })

            })


        }

    }


}
