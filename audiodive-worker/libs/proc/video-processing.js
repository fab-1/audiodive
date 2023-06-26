const {bucket, getPublicUrl} = require(__base + 'libs/utils/storage-util')
const Transfer = require(__base + 'libs/utils/transfer-util')
const os = require('os')
const fs = require('fs-extra')
const { join } = require('path');
const Promise = require('promise')
const models  = require(__base + 'models')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const { v4: uuidV4 } = require('uuid')
const shortid = require('shortid')
//const puppeteer = require('puppeteer')
const audioProcessing = require('./audio-processing')
const playwright = require('playwright')
const {performance}= require('perf_hooks')

const FRAME_URL = process.env.FRAME_URL

const IMAGE_EXTENSION = 'jpg'

function getInfo(path) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(path, (err, data) => {
            if (data.streams && data.streams.length) {
                resolve(data.streams[0])
            }
            else {
                reject('could not find info ', path)
            }
            console.dir(data.streams[0].duration)
        })
    })
}

function pad(n, width, z) {
    z = z || '0'
    n = n + ''
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
}

const FPS = 40
const FRAME_DURATION_MS = 1000/40

const configKeys = {
    'vertical': 'configVertical',
    'wide': 'configWide',
    'square': 'configSquare'
}

const videoJob = async (job) => {

    const {clipId, userId, blocks, customContent, templateId, ratio} = job.data

    let clipRecord
    let browser

    // const browser = await puppeteer.launch({headless: true, args:[
    //
    //     '--no-sandbox', '--disable-setuid-sandbox', '--mute-audio=false',
    //     ]})

    try {

        browser = await playwright.chromium.launch({
            // force GPU hardware acceleration
            // (even in headless mode)
            args: ["--use-gl=egl"]
        });

        const clipVideoRecord = await models.ClipVideo.findOne({where: {ClipId: clipId, ready: false}})
        clipRecord = await models.Clip.findOne({
            where: {
                id: clipId
            }
        })

        const {config} = clipRecord

        let range = null
        let url = `${FRAME_URL}${clipId}?ratio=${ratio}&key=SyDzrU7qG`

        if (blocks) {
            url += `&blocks=${blocks}`

            const onlyShowBlocks = blocks.split(',')
            const {blocksById, wordsById} = config
            const firstBlock = blocksById[onlyShowBlocks[0]]
            const lastBlock = blocksById[onlyShowBlocks[onlyShowBlocks.length - 1]]
            const firstWord = wordsById[firstBlock.wordIds[0]]
            const lastWord = wordsById[lastBlock.wordIds[lastBlock.wordIds.length - 1]]

            const end = (lastWord.end * 1000 + 300) / 1000

            range = {
                start: firstWord.start,
                end,
                durationMs: (end * 1000 - firstWord.start * 1000) / 1000
            }
        }

        if (range)
            url += `&customRange=${encodeURIComponent(JSON.stringify(range))}`

        if (customContent)
            url += `&customContent=${customContent}`

        if (templateId)
            url += `&template_id=${templateId}`



        const audioUrl = clipRecord.audioUrl.includes('http')? clipRecord.audioUrl:getPublicUrl(clipRecord.audioUrl)
        let audioPath = `${os.tmpdir()}/master_${clipRecord.id}.mp3`
        //Download original audio file
        const download = new Transfer({
            url: audioUrl,
            progress: progress => {}
        })
        await download.saveToDisk(audioPath)

        job.progress(5)

        let audioInfo = await getInfo(audioPath)
        const totalDuration  = audioInfo.duration
        url += `&duration=${totalDuration}`

        console.log('url', url)

        if (range) {

            const outputPath = `${os.tmpdir()}/clip_${clipRecord.id}.mp3`

            //Cut the clip with ffmpeg
            await audioProcessing.convertAudio(audioPath, outputPath, range.start, range.end, 0)

            audioInfo = await getInfo(outputPath)

            fs.removeSync(audioPath)

            audioPath = outputPath
        }

        const generatedPath = `/f/${clipRecord.FeedId}/video/clip_${clipRecord.id}_${shortid.generate()}`
        const destVideoClipPath = `${generatedPath}.mp4`
        const destGifClipPath = `${generatedPath}.gif`
        const destCoverPicPath = `${generatedPath}.${IMAGE_EXTENSION}`

        const framesDir = `${os.tmpdir()}/frames_output_${clipId}`

        //Get the right resolution
        let res = {width: 1280, height: 720}
        if (ratio === 'square') {
            res = {width: 720, height: 720}
        }
        if (ratio === 'vertical') {
            res = {width: 720, height: 1280}
        }

        //Clean/create up directory
        if (fs.existsSync(framesDir)) {
            fs.removeSync(framesDir)
        }
        fs.mkdirSync(framesDir)


        //Get total frames based on duration
        let totalFrames = Math.ceil(audioInfo.duration * 1000 / FRAME_DURATION_MS)
        console.log(`total frames: ${totalFrames}, total time: ${audioInfo.duration}`)

        let frameIndex = 1;
        let startTime, endTime

        const startOptions = {
            format: 'jpeg',
            quality: 90,
            maxWidth: res.width,
            maxHeight: res.height
        };

        const getFilename = index => join(os.tmpdir(), `frames_output_${clipId}`, `frame_${pad(index, 5)}.${IMAGE_EXTENSION}`)

        const context = await browser.newContext();
        const page = await context.newPage();
        await page.setViewportSize(res)
        await page.goto(url)
        await page.evaluate(() => appStatus())

        job.progress(10)

        startTime = performance.now()

        let tenPercentProgress = true
        let screenshots = []
        let savePromises = []
        for (let frameIndex = 1; frameIndex < totalFrames; frameIndex++) {


            const pr = Math.round((frameIndex/totalFrames) * 100)
            if (pr%10 === 0 ) {
                console.log(pr + '%')
                tenPercentProgress = false
            }
            else {
                tenPercentProgress = true
            }

            //setting progress
            const progress = 10 + Math.floor((frameIndex/totalFrames) * 80)
            job.progress(progress)

            const framePath = `${framesDir}/frame_${pad(frameIndex, 5)}.${IMAGE_EXTENSION}`

            await page.evaluate(frameN => {
                return appInstance.nextStep()
            })

           // console.time('screen')

            await page.screenshot({
                path: framePath,
                quality: IMAGE_EXTENSION === 'jpg'? 90 : undefined,
                omitBackground: IMAGE_EXTENSION === 'png'? true : undefined,
                caret: 'initial',
                animations: "disabled"
            })


            // const base64 = (await (await page.context().newCDPSession(page)).send('Page.captureScreenshot', {format: 'jpeg', quality: 90})).data
            // //console.time('savingfile')
            // savePromises.push(fs.writeFile(framePath, base64, {encoding: 'base64'}))

           // console.timeEnd('screen')
        }

        // await Promise.all(savePromises)

        endTime = performance.now()

        //Save preview pic
        const pictureTimeMs = (config.globalSettings && config.globalSettings.pictureTime || 2) * 1000
        const pictureFrameIndex = Math.ceil(pictureTimeMs / FRAME_DURATION_MS)
        const pictureFilename = getFilename(pictureFrameIndex)
        await saveToBucket(pictureFilename, destCoverPicPath, 'image/jpeg')
        await models.ClipVideo.update({imageUrl: destCoverPicPath}, {where: {ClipId: clipId, ready: false}})


        const renderingTime = endTime - startTime

        console.log('rendering time', renderingTime)
        console.log('Frames per seconds', totalFrames/renderingTime)

        await browser.close()

        const clipPath = await launchCommand({audioPath, framesDir, job})
        await saveToBucket(clipPath, destVideoClipPath)

        const gifPath = await makeGif({framesDir, job})
        await saveToBucket(gifPath, destGifClipPath, 'image/gif')

        job.progress(99)

        await models.ClipVideo.update({
            videoUrl: destVideoClipPath,
            gifUrl: destGifClipPath,
            ready: true
        },{
            where: {ClipId: clipId, ready: false}
        })

        //save a screenshot for the template
        //const template = await models.Template.findByPk(clipRecord.TemplateId)
        //const configKey = configKeys[config.ratio]

        //if (template && template[configKey]) {
        //    template[configKey].previewPicture = destCoverPicPath
        //}

        const newConfig = Object.assign({}, clipRecord.config, {
            screenshots
        })

        await clipRecord.update({
            config: newConfig,
            status: 'ready'
        })

        const user = await models.User.findByPk(userId)

        // EmailUtils.sendEmail(user.emailAddress, `Your clip '${clipRecord.name}' is ready`, {
        //     clipName: clipRecord.name,
        //     videoUrl: getPublicUrl(destVideoClipPath),
        //     coverUrl: getPublicUrl(destGifClipPath),
        //     clipUrl: 'https://audiodive.app/app/library/clip/'+clipRecord.id
        // })

        fs.removeSync(audioPath)
        fs.removeSync(framesDir)
        fs.removeSync(gifPath)
        fs.removeSync(clipPath)

        job.progress(100)

        return Promise.resolve({
            path: destVideoClipPath,
            totalTime: renderingTime
        })
    }
    catch(err) {
        console.error('Error while running a video job ')

        if (browser) {
            browser.close()
        }

        if (clipRecord) {
            clipRecord.update({status: 'ready'})
        }

        const record = await models.ClipVideo.findOne({where: {ClipId: clipId, ready: false}})

        if (record) {
            record.destroy()
        }

        return Promise.reject(err)
    }
}

function launchCommand({audioPath, framesDir, job}) {

    return new Promise((resolve, reject) => {

        const destVideo = `${os.tmpdir()}/video_${uuidV4()}.mp4`
        const ffmpegCommand = ffmpeg()

        let inputName = '1:v'

        ffmpegCommand.input(audioPath).
        input(`${framesDir}/frame_%05d.${IMAGE_EXTENSION}`).
        inputFPS(FPS)

        ffmpegCommand.outputOptions([`-map ${inputName}`, '-map 0:a', '-pix_fmt yuv420p']).
        videoCodec('libx264').
        audioCodec('aac').
        on('start', function(commandLine) {
            console.log('Spawned Ffmpeg with command: ' + commandLine)
        }).
        on('progress', function(progress) {
            //80 percent used by frames proc
            const pr = 90 + (progress.percent/100) * 8

            job.progress(Math.floor(pr))
            console.log('Processing: ' + progress.percent + '% done')
        }).
        on('error', function(error) {
            console.log('error: ' + error)
            reject(error)
        }).
        on('end', function() {
            console.log('end')
            resolve(destVideo)
        }).
        save(destVideo)

    })
}


function makeGif({framesDir, job}) {

    return new Promise((resolve, reject) => {

        const destVideo = `${os.tmpdir()}/video_${uuidV4()}.gif`
        const ffmpegCommand = ffmpeg()

        ffmpegCommand.input(`${framesDir}/frame_%05d.${IMAGE_EXTENSION}`).
        seekInput(1).
        duration(3).
        inputFormat('image2').
        inputFPS(20).
        on('start', function(commandLine) {
            console.log('Spawned Ffmpeg with command: ' + commandLine)
        }).
        on('progress', function(progress) {

        }).
        on('error', function(error) {
            console.log('error: ' + error)
            reject(error)
        }).
        on('end', function() {
            console.log('end')
            resolve(destVideo)
        }).
        save(destVideo)

    })
}

function saveToBucket(teaserPath, teaserName, contentType = 'video/mp4') {

    return new Promise(function (fulfill, reject){
        const file = bucket.file(teaserName)

        const inputStream = fs.createReadStream(teaserPath)
        const outputStream = file.createWriteStream({
            metadata: { contentType }
        })

        outputStream.on('error', (err) => {
            reject(err)
        })

        outputStream.on('finish', () => {
            console.log(getPublicUrl(teaserName))
            fulfill(getPublicUrl(teaserName))
        })

        inputStream.pipe(outputStream)
    })
}


module.exports = {
    videoJob
}

