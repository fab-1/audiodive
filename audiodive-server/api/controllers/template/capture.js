const { v4: uuidv4 } = require('uuid')
const path = require('path')
const models = sails.hooks.sequelize.models
const mime = require('mime-types')
const TransferUtil = require('../../libs/transfer-util')
//const unsplash = new Unsplash({ accessKey: APP_ACCESS_KEY });
const storage = sails.hooks.storage
const playwright = require('playwright')
const os = require('os')

module.exports = async function template_screen(req, res) {

    // if (!req.me.isSuperAdmin) {
    //     return res.send('no!')
    // }


    const gcloud = sails.config.gcloud

    const FRAME_URL = sails.config.environment === 'production' ?
        'https://audiodive.app/preview/':
        'http://localhost:8083/preview/'

    const ratio = 'square'
    const params = req.validator([{templateId: 'int'}])

    const browser = await playwright.chromium.launch();


    const {templateId} = params

    let query = {
        where: {
            id: templateId
        },
        include: [{
            model: models.UserTemplate
        }]
    }

    if (!req.me.isSuperAdmin) {
        query.include = [{
            model: models.UserTemplate,
            where: {
                UserId: req.me.id
            }
        }]
    }

    const template = await models.Template.findOne(query)
    if (!template) {
        return res.forbidden()
    }


    let ratioKey = 'configWide'
    let dimensions = {width: 1280, height: 720}
    if (ratio === 'square') {
        dimensions = {width: 720, height: 720}
        ratioKey = 'configSquare'
    }
    if (ratio === 'vertical') {
        dimensions = {width: 720, height: 1280}
        ratioKey = 'configVertical'
    }

    const url = `${FRAME_URL}1?ratio=${ratio}&key=SyDzrU7qG&template_id=` + templateId

    console.log(url)

    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.setViewportSize(dimensions)
        await page.goto(url)
        await page.evaluate(() => appStatus())

        const framesDir = `${os.tmpdir()}/frames_output_${templateId}.jpg`

        await page.evaluate(frameN => {
            return appInstance.seek(111)
        })

        await page.screenshot({path: framesDir, quality: 90})

        const download = new TransferUtil({
            path: framesDir
            //progress: progress => console.log(progress)
        })

        const filePath = `/user/${req.me.id}/template_captures/${uuidv4()}.jpg`
        await download.saveToBucket(storage.bucket.file(filePath), 'image/jpeg')
        console.log(gcloud.getPublicUrl(filePath))

        const templateConfig = template[ratioKey]
        templateConfig.previewPicture = filePath

        await template.update({
            [ratioKey] : templateConfig
        })

        res.send('ok')
    }
    catch(e) {
        console.error(e)
    }

}
