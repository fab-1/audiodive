
const models = sails.hooks.sequelize.models

const mime = require('mime-types')
const PlansUtils = sails.hooks.plans
const plans = sails.config.plans

module.exports = async function upload(req, res) {


    const {PodcastId, FeedId, fadeDuration, start, end} = req.body.clip
    let {multipleSpeakers, languageCode, getTranscript} = req.body

    const {periodStart, accessLevel} = await PlansUtils.getInfos(req.me)
    const {audioImported, videoExported} = await PlansUtils.getQuotas(req.me, periodStart)

    const nextCycleDate = periodStart.add(1, 'month')

    const currentPlan = plans[accessLevel]

    if (currentPlan) {
        const remainingTime = currentPlan.maxSecondsImport - audioImported
        const maxClipTime = currentPlan.maxSecondsClipDuration

        const maxLength = Math.min(remainingTime, maxClipTime)

        let currentLength = end - start

        if (currentLength <= 0 || currentLength > maxLength) {
            return res.status(500).send('The clip length is not valid')
        }
    }


    const recordData = {
        status: getTranscript ? 'transcribing' : 'pending',
        name: `${req.me.fullName}'s Clip`,
        PodcastId,
        start,
        end,
        config: {
            fadeDuration
        },
        FeedId,
        UserId: req.me.id
    }

    const record = await models.Clip.create(recordData)

    await models.UserClip.create({
        ClipId: record.id,
        UserId: req.me.id,
        role: 'owner'
    })

    // background.queueAudioCut({
    //     clipId: record.id, userId: req.me.id, multipleSpeakers, languageCode, getTranscript
    // })
    // if (data.end) {
    //   background.queueAudioCut(record.id, userId)
    // }
    //
    // if (data.audioUrl) {
    //   background.queueTranscript(record.id, userId)
    // }
    res.json(record.toJSON())

}
