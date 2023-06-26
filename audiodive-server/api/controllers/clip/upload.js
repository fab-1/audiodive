const { v4: uuidv4 } = require('uuid')
const path = require('path')
const models = sails.hooks.sequelize.models
const mime = require('mime-types')
const PlansUtils = sails.hooks.plans
const plans = sails.config.plans
const axios = require('axios')

module.exports = async function upload(req, res) {

    const JOBS_URL = `${process.env.JOBS_URL}/audioCut`

    const params = req.validator(['showId', 'getTranscript', 'isMusic', 'multipleSpeakers', 'languageCode', 'clipCut', 'transcript', 'audioUrl', 'fileName'])

    if (!params) {
        return
    }

    let { multipleSpeakers, clipCut, languageCode, getTranscript, transcript, isMusic, showId, audioUrl, fileName } = params

    audioUrl = audioUrl.replace(`${process.env.GCLOUD_BASE_PATH}/${process.env.GCLOUD_BUCKET}`, '')

    const show = await models.Feed.findByPk(showId)

    if (!show && showId !== -1) {
        return res.badRequest('Invalid Show')
    }

    const clipCutData = clipCut

    if (clipCutData) {
        const { periodStart, accessLevel } = await PlansUtils.getInfos(req.me)
        const { audioImported, videoExported } = await PlansUtils.getQuotas(req.me, periodStart)

        const nextCycleDate = periodStart.add(1, 'month')

        const currentPlan = plans[accessLevel]

        if (currentPlan) {
            const remainingTime = currentPlan.maxSecondsImport - audioImported
            const maxClipTime = currentPlan.maxSecondsClipDuration

            const maxLength = Math.min(remainingTime, maxClipTime)

            let currentLength = clipCutData.end - clipCutData.start

            if (currentLength <= 0 || currentLength > maxLength) {
                return res.status(500).send('The clip length is not valid')
            }
        }
    }

    const name = path.basename(fileName)

    let clipObject = {}
    let config = {}

    const baseData = {
        status: 'pending',
        name: `${name}`,
        isMusic: isMusic,
        UserId: req.me.id
    }

    if (clipCutData) {
        clipObject = Object.assign({}, {
            start: clipCutData.start,
            originalAudioUrl: audioUrl,
            end: clipCutData.end
        }, baseData)

        config = Object.assign({}, {
            fadeDuration: clipCutData.fadeDuration
        }, config)
    }
    else {
        clipObject = Object.assign({}, {
            audioUrl
        }, baseData)
    }

    clipObject.config = config

    let record

    try {

        record = await models.Clip.create(clipObject)

        await models.UserClip.create({
            ClipId: record.id,
            UserId: req.me.id,
            role: 'owner'
        })

        const res = await axios.post(JOBS_URL, {
            clipId: record.id,
            userId: req.me.id,
            multipleSpeakers,
            languageCode,
            getTranscript
        })

        console.log(res.data);

        await record.update({
            status: (clipCutData ? 'cutting' : (getTranscript ? 'transcribing' : 'ready'))
        })

    }
    catch (error) {
        console.error(error)
        return res.error(error)
    }
    // if (data.end) {
    //   background.queueAudioCut(record.id, userId)
    // }
    //
    // if (data.audioUrl) {
    //   background.queueTranscript(record.id, userId)
    // }

    res.json(record.toJSON())

}
