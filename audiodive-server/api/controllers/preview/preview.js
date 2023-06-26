
const models = sails.hooks.sequelize.models

module.exports = async function preview(req, res) {

    const params = req.validator([{clipId: 'int'}])
    const {template_id} = req.query

    if (!params) {
        throw ('Invalid parameters')
    }

    const userAgent = req.headers['user-agent']


    const allow = (req.me && req.me.isSuperAdmin) || req.query.key === 'SyDzrU7qG'

    if (!allow) {
        console.error('weird!!!')
        throw ('not allowed')
    }

    const {clipId} = params

    const clip = await models.Clip.findOne({
        where: {
            id: clipId
        },
        include: [{
            model: models.Feed
        }]
    })

    const clipConfig = clip.config

    if (template_id) { // && clip.id === 1) {
        clip.TemplateId = Number(template_id)
    }

    if (!clip.TemplateId && clipConfig.globalSettings && clipConfig.globalSettings.layoutId) {
        clip.TemplateId = clipConfig.globalSettings.layoutId
    }

    let fontsToLoad = {}
    let defaultFont = null
    let layouts = {}

    const addFont = (textObject) => {
        let {fontFamily, fontVariants, fontWeight} = textObject

        // if (fontVariants && fontWeight && (fontVariants.length > 1 || fontVariants[0] !== 'regular')) {
        //     fontFamily = `${fontFamily}:${fontWeight}`
        // }

        if (!fontFamily && !fontWeight) {
            return
        }

        if (fontFamily === 'Helvetica') {
            return
        }

        // if (customFonts.find(font => font.name === fontFamily)) {
        //     return
        // }

        if (!fontFamily) {
            fontFamily = defaultFont.fontFamily
        }

        if (!fontVariants && defaultFont) {
            fontVariants = defaultFont.fontVariants
        }

        //the default font weight is 400
        if (!fontVariants || !fontVariants.includes(fontWeight)) {
            fontWeight = '400'
        }

        const existingFont = fontsToLoad[fontFamily]
        if (existingFont) {
            !existingFont.includes(fontWeight) && fontsToLoad[fontFamily].push(fontWeight)
        }
        else {
            fontsToLoad[fontFamily] = [fontWeight]
        }
    }

    const addLayout = (layout) => {

        ['configSquare', 'configWide', 'configVertical'].forEach(configKey => {

            const elements = layout[configKey].linkedElements || layout[configKey]

            for (let key in elements) {
                const element = elements[key]

                if (!element) {
                    break
                }

                addFont(element)

                if (!defaultFont && key === 'textArea') {
                    defaultFont = {
                        fontVariants: element.fontVariants,
                        fontFamily: element.fontFamily
                    }
                }
            }

            layouts[layout.id] = layout.toJSON()
        })
    }

    const templateId = clip.TemplateId

    if (templateId) {
        const layout = await models.Template.findByPk(templateId)

        if (template_id && clip.id === 1) {
            clip.name = layout.name
        }

        addLayout(layout, layouts)
    }

    if (clipConfig.blockIds) {
        for (let i = 0; i < clipConfig.blockIds.length; i++) {
            const block = clipConfig.blocksById[clipConfig.blockIds[i]]

            if (block.customStyles) {
                addFont(block.customStyles)
            }

            if (block.layout && !layouts[block.layout]) {
                const layout = await models.Template.findByPk(block.layout)
                addLayout(layout, layouts)
            }

            block.wordIds.forEach(wordId => {

                const word = clipConfig.wordsById[wordId]
                if (word.customStyles) {
                    addFont(word.customStyles)
                }
            })
        }
    }

    const customFonts = await models.CreatorAssets.findAll({
        where: {
            type: 'font',
            name: Object.entries(fontsToLoad).map(([k, v]) => k)
        }
    })

    let cssUrls = customFonts.map(font => {
        if (font.UserId) return `${process.env.GCLOUD_BASE_PATH}/${process.env.GCLOUD_BUCKET}/user/${font.UserId}/font/${font.name}.css`
        else return `${process.env.GCLOUD_BASE_PATH}/${process.env.GCLOUD_BUCKET}/c/${font.CreatorId}/font/${font.name}.css`
    })

    Object.entries(fontsToLoad).forEach(
        ([family, weights]) => {
            const fontWeights = weights.join(',')
            cssUrls.push(`https://fonts.googleapis.com/css?family=${family}:${fontWeights}`)
        }
    )

    const basePath = sails.config.gcloud.path

    //let bundlePath = `${sails.config.custom.webpackPreviewUrl}/bundle-preview.js`
    // const version = await redisClient.get('config2:PREVIEW_VERSION')
    //
    // if (version && sails.config.environment === 'production') {
    //   bundlePath = `${basePath}/beta/${version}/bundle-preview.js`
    // }

    const redisClient = sails.hooks.ioredis.client
    const gcloud = sails.config.gcloud

    //let stylesPath = `${sails.config.custom.webpackUrl}/style.css`
    let bundlePath = `${sails.config.custom.webpackPreviewUrl}/bundle-preview.js`

    //const version = await redisClient.get('config2:PREVIEW_VERSION')

    if (sails.config.environment === 'production') {
        const version = process.env.VERSION
        bundlePath = gcloud.getPublicUrl(`/beta/${version}/bundle-preview.js`)
    }
    //
    // if (version && sails.config.environment === 'production') {
    //     bundlePath = gcloud.getPublicUrl(`/beta/${version}/bundle-preview.js`)
    // }


    res.render('pages/dashboard/preview', {
        layout: false,
        cssUrls: cssUrls,
        bundlePath: bundlePath,
        layoutConfigs: JSON.stringify(layouts),
        clip: JSON.stringify(clip.toJSON())
    })
}
