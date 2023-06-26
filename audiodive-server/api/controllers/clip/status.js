const models = sails.hooks.sequelize.models

module.exports = async function get(req, res) {

    const params = req.validator([{clipId: 'int'}])

    if (!params.clipId) {
        return res.badRequest('Invalid parameters')
    }

    const clipRecord = await models.Clip.findByPk(params.clipId, {
        include: [{
            model: models.ClipVideo,
            where: {
                ready: false
            }
        }]
    })

    if (!clipRecord) {
        return res.json(1)
    }

    const videoJobs = await sails.hooks.jobs.getVideoQueue().getActive()

    const currentJob = videoJobs.find(job => job.data.clipId === params.clipId)

    res.json(currentJob ? currentJob._progress / 100 : 0)
}
