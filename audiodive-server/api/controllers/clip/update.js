const models = sails.hooks.sequelize.models
const mime = require('mime-types')
module.exports = async function update(req, res) {

    const params = req.validator([{
        clipId: 'int'
    }])

    if (!params) {
        return //res.badRequest('Invalid parameters')
    }

    let query = {
        where: {
            id: params.clipId
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

    let {config, FeedId, template, TemplateId, metaData, name, ratio} = req.body
    //let {name} = params
    let clonedTemplate = null
    let templatedCloned = false

    const LIB_TEMPLATE_FEED_ID = 1

    try {
        if (template) {
            const shouldCloneTemplate = !req.me.isSuperAdmin && (template.id === 'clone' || [LIB_TEMPLATE_FEED_ID].includes(template.FeedId))
            //if it's a clone or part of the library templates
            if (shouldCloneTemplate) {

                delete template.FeedId

                if (template.FeedId !== null)
                    template.name = "Template for " + clip.name

                delete template.id

                const clone = await models.Template.create(template)

                const userTemplate = await models.UserTemplate.create({
                    TemplateId: clone.id,
                    UserId: req.me.id,
                    role: 'owner'
                })

                TemplateId = clone.id

                clonedTemplate = clone.toJSON()
                clonedTemplate.UserTemplates = [userTemplate.toJSON()]

                templatedCloned = true
            }
            else {
                let query = {
                    where: {
                        id: template.id
                    }
                }

                if (!req.me.isSuperAdmin) {
                    query.include = [{
                        model: models.UserTemplate,
                        where: {
                            UserId: req.me.id
                        }
                    }]
                }

                const existing = await models.Template.findOne(query)
                if (existing) {
                    const {name, configWide, configSquare, configVertical} = template
                    await existing.update({
                        name,
                        configWide,
                        configSquare,
                        configVertical
                    })
                }
            }


        }

        await clip.update({
            name,
            TemplateId,
            config,
            metaData,
            FeedId,
            ratio
        })

        res.json({
            clip: clip.toJSON(),
            template: clonedTemplate,
            templatedCloned
        })
    }
    catch (e) {
        console.error(e)
    }


}
