const { v4: uuidv4 } = require('uuid')
const path = require('path')
const models = sails.hooks.sequelize.models
const mime = require('mime-types')
const PlansUtils = sails.hooks.plans
const plans = sails.config.plans
const axios = require('axios')

module.exports = async function upload(req, res) {

    const JOBS_URL = `${process.env.JOBS_URL}/audioCut`
    const clipData = req.file('clipData')

    if (!clipData._files.length) {
        return res.badRequest('No File')
    }

    const originalStream = clipData._files[0].stream

    const params = req.validator([{showId: 'int'}])
    const showId = params.showId || -1


    let {multipleSpeakers, clipCut, languageCode, getTranscript, transcript, isMusic} = req.body

    getTranscript = parseInt(getTranscript)
    isMusic = parseInt(isMusic)

    if (!params) {
        return res.badRequest('Invalid parameters')
    }

    const show = await models.Feed.findByPk(showId)

    if (!show && showId !== -1) {
        return res.badRequest('Invalid Show')
    }

    const clipCutData = clipCut && JSON.parse(clipCut)

    if (clipCutData) {
        const {periodStart, accessLevel} = await PlansUtils.getInfos(req.me)
        const {audioImported, videoExported} = await PlansUtils.getQuotas(req.me, periodStart)

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

    let extension = path.extname(originalStream.filename)
    const name = path.basename(originalStream.filename)
    const contentType = originalStream.headers['content-type']
    if (!extension && contentType) {
        extension = '.' + mime.extension(contentType)
    }
    const filePath = `s/${showId}/${req.me.id}_${uuidv4()}${extension}`

    const metadata = {contentType}

    const uploadConfig = Object.assign({
        public: true,
        maxBytes: 50000000, //50MB max
        saveAs: filePath,
        metadata
    }, sails.config.gcloud)

    clipData.upload(uploadConfig, async (err, filesUploaded) => {

        if (err) return res.serverError(err)

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
                originalAudioUrl: '/' + filePath,
                end: clipCutData.end
            }, baseData)

            config = Object.assign({}, {
                fadeDuration: clipCutData.fadeDuration
            }, config)
        }
        else {
            clipObject = Object.assign({}, {
                audioUrl: '/' + filePath
            }, baseData)
        }

        clipObject.config = config

        const record = await models.Clip.create(clipObject)

        await models.UserClip.create({
            ClipId: record.id,
            UserId: req.me.id,
            role: 'owner'
        })

        if (clipCutData) {
            // background.queueAudioCut({
            //     clipId: record.id,
            //     userId: req.me.id,
            //     multipleSpeakers,
            //     languageCode,
            //     getTranscript
            // })

            try {
                const res = await axios.post(JOBS_URL, {
                    clipId: record.id,
                    userId: req.me.id,
                    multipleSpeakers,
                    languageCode,
                    getTranscript
                })

                console.log(res.data);
            }
            catch(error) {
                console.error(error)
            }
        }
        else if (getTranscript) {

            // background.queueTranscript({
            //     clipId: record.id, userId: req.me.id,
            //     multipleSpeakers,
            //     languageCode
            // })

        }

        await record.update({
            status: (clipCutData ? 'cutting' : (getTranscript ? 'transcribing' : 'ready'))
        })

        // if (data.end) {
        //   background.queueAudioCut(record.id, userId)
        // }
        //
        // if (data.audioUrl) {
        //   background.queueTranscript(record.id, userId)
        // }

        res.json(record.toJSON())
    })

}
