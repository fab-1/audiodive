
const models = sails.hooks.sequelize.models
const mime = require('mime-types')
const axios = require('axios')

module.exports = async function update(req, res) {

    const JOBS_URL = `${process.env.JOBS_URL}/processVideo`

    const params = req.validator(['clipId', 'processConfig'])

    if (!params) {
        return //res.badRequest('Invalid parameters')
    }

    const {clipId, processConfig} = params
    const {ratio} = processConfig


    const userId = req.me.id

    let query = {
        where: {
            id: clipId
        }
    }

    if (!req.me.isSuperAdmin) {
        query.include = [{
            model: models.UserClip,
            where: {
                UserId: req.me.id
            }
        }]
    }

    /* todo us ACL for preventing update instead */
    const clip = await models.Clip.findOne(query)

    if (!clip) {
        return res.notFound('This clip does not exists in this world')
    }

    let clipVideo = await models.ClipVideo.findOne({
        where: {
            ready: false,
            ratio,
            ClipId: clipId,
            UserId: userId
        }
    })

    if (!clipVideo) {
        clipVideo = await models.ClipVideo.create({
            ready: false,
            ratio,
            ClipId: clipId,
            UserId: userId
        })

        await clipVideo.update({
            name: `Version ${clip.id}`
        })

        await clip.update({status: 'processing'})

        try {
            const res = await axios.post(JOBS_URL, {
                action: 'processVideo',
                clipId,
                userId,
                ratio
            })

            console.log(res.data);
        }
        catch(error) {
            console.error(error.message)
        }

        res.send('POSTED')

        //background.queueVideo(clipId, userId, processConfig)
    }
    else {
        res.forbidden({
            error: 'There is already a version processing for this clip'
        })
    }


}
