'use strict'

global.__base = __dirname + '/'

require('dotenv').config()

const path = require('path')
const BullMonitorExpress  = require('@bull-monitor/express').BullMonitorExpress
const BullAdapter = require('@bull-monitor/root/dist/bull-adapter').BullAdapter


const express = require('express')
const Queue = require('bull')
const Redis = require('ioredis')
const audioProcessing = require('./libs/proc/audio-processing.js')

const IS_PROD = process.env.NODE_ENV === 'production'
const DEV_SUFFIX = (IS_PROD ? '' : '-dev')

const redisConfig = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
}

const client = new Redis(redisConfig)
const subscriber = new Redis(redisConfig)
const other = new Redis(redisConfig)

const opts = {
    createClient: type => {
        switch (type) {
            case 'client':
                return client
            case 'subscriber':
                return subscriber
            default:
                return other
        }
    }
}

const jobPromisesById = []

const videoQueue = new Queue('video-clip-processing'+ DEV_SUFFIX, opts)
videoQueue.process('clip', 1, __base + './video-worker.js')
videoQueue.on('active', (job, jobPromise) => jobPromisesById[job.id] = jobPromise)
videoQueue.on('completed', job => console.log('completed', job.data))
videoQueue.on('error', error => console.error('job error', error))
videoQueue.on('stalled', job => console.log('stalled', job.data))
videoQueue.on('failed', job => console.error('failed', job.id, job.failedReason, job.data))

const audioQueue = new Queue('audio-jobs'+ DEV_SUFFIX, opts)
audioQueue.process('audio-cut', 1, audioProcessing.AudioCutJob)
audioQueue.process('transcript', 1, audioProcessing.TranscriptJob)
audioQueue.process('fft', 1, audioProcessing.FFTJob)

const monitor = new BullMonitorExpress({
    queues: [
        new BullAdapter(audioQueue),
        new BullAdapter(videoQueue),
    ]
});


const app = express()

app.use('/public', express.static(path.join(__dirname, 'public')))

app.use(express.json())

app.get('/_ah/warmup', (req, res) => {
    // Handle your warmup logic. Initiate db connection, etc.
});

app.get('/_ah/start',
    (req, res) => {
    res.status(200).send('ok')
})

app.get('/_ah/health',
    (req, res) => {
    res.status(200).send('ok')
})

app.get('/liveness_check',
    (req, res) => {
    res.status(200).send('ok')
})

app.get('/readiness_check',
    (req, res) => {
    res.status(200).send('ok')
})

app.get('/',
    async (req, res) => {

        let clipRecord = await models.Clip.findByPk(clipId)
        console.log(clipRecord)
    res.send(`ah`)
})

app.post('/processVideo',  (req, res) => {
    const {clipId, ratio, userId, blocks, customContent, templateId, highlightId} = req.body
    videoQueue.add('clip', {clipId, ratio, userId, customContent, blocks, templateId, highlightId})
    res.send(`job posted`)
})

app.post('/processTranscript',  (req, res) => {
    const {clipId, config, userId} = req.body
    audioQueue.add('transcript', {clipId, config, userId})
    res.send(`job posted`)
})

app.post('/getFFT',  (req, res) => {
    const {clipId, config, userId} = req.body
    audioQueue.add('fft', {clipId, config, userId})
    res.send(`job posted`)
})

app.post('/audioCut',  (req, res) => {
    audioQueue.add('audio-cut', req.body)
    res.send(`job posted`)
})

;(async () => {



    //if (!config.get('isProd')) {
        await monitor.init();
        app.use('/monitor', monitor.router);
    //}
    const port = IS_PROD? null : 8080
    if (module === require.main) {
        const server = app.listen(port, () => {
            const port = server.address().port
            console.log(`App listening on port ${port}`)
        })
    }
})()


if (module === require.main) {
    try {
        //subscribeAudio()
    }
    catch(e) {
        console.error(e)
    }
}

exports.app = app
