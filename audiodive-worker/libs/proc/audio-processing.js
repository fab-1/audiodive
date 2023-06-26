const os = require('os')
const fs = require('fs-extra')
const Promise = require('promise')
const models  = require(__base + 'models')
const ffmpeg = require('fluent-ffmpeg')
const Transfer = require('../utils/transfer-util')
const { v4: uuidV4 } = require('uuid')
const speechBeta = require('@google-cloud/speech').v1p1beta1
const speech = require('@google-cloud/speech').v1
const path = require ('path')
const audioEngine = require("web-audio-engine")
const RenderingAudioContext = audioEngine.RenderingAudioContext
const chunk = require("lodash/chunk")
const peakbuilder = require('wavesurfer-peakbuilder')


var client = new speech.SpeechClient({
    projectId: process.env.GCLOUD_PROJECT_ID
})

var clientBeta = new speechBeta.SpeechClient({
    projectId: process.env.GCLOUD_PROJECT_ID
})

const CLOUD_BUCKET = process.env.GCLOUD_BUCKET
const {bucket, getPublicUrl} = require(__base + 'libs/utils/storage-util')

const getSortedWordIds = (wordsById) => {
    const wordEntries = Object.entries(wordsById)
    wordEntries.sort((entry1, entry2) => {
        return entry1[1].start - entry2[1].start
    })
    return wordEntries.map(entry => entry[0])
}

const getCleanConfig = (config) => {

    let newConfig = {
        wordsById: {},
        blocksById: {},
        mediasById:{}
    }

    config.words.forEach((word, index) => {
        const cleanWord = {...word}

        if (!cleanWord.id) {
            cleanWord.id = `w${index}`
        }

        const previousWord = config.words[index - 1];
        const nextWord = config.words[index + 1];

        if (!previousWord) {
            //cleanWord.start = 0;
        }

        if (nextWord) {
            cleanWord.actualEnd = cleanWord.end
            cleanWord.end = nextWord.start;
        }

        //some words returned by google have no duration
        if (cleanWord.end <= cleanWord.start) {
            cleanWord.end = cleanWord.start + 100;
            if (nextWord && nextWord.start < cleanWord.end) {
                nextWord.start = cleanWord.end
            }
        }

        cleanWord.start /= 1000
        cleanWord.end /= 1000
        cleanWord.actualEnd /= 1000

        newConfig.wordsById[cleanWord.id] = cleanWord
    })

    newConfig.wordIds = getSortedWordIds(newConfig.wordsById)

    let blocksById = {}
    let blockIds = []
    //const wordsChunks = chunk(newConfig.wordIds, 12)

    let blockIndex = 0
    let wordCount = 1
    newConfig.wordIds.forEach((wordId, index) => {

        const word = newConfig.wordsById[wordId]
        const previousWord = index > 0 && newConfig.wordsById[newConfig.wordIds[index - 1]]
        const block = blocksById[`b${blockIndex}`]

        const hasReachedMaxWords = wordCount === 25
        const differentSpeaker = block && block.speakerTag !== word.speakerTag
        const hasReachedEnoughWordsAndAPeriod = previousWord && (wordCount > 15 && previousWord.word.includes('.'))
        if (hasReachedMaxWords || differentSpeaker || hasReachedEnoughWordsAndAPeriod) {
            console.log(wordCount)
            blockIndex++
            wordCount = 0
        }

        let blockId = `block_${blockIndex}`

        if (!blocksById[blockId]) {
            blocksById[blockId] = {
                id: blockId,
                wordIds:[],
                speakerTag: word.speakerTag
            }

            blockIds.push(blockId)
        }

        blocksById[blockId].wordIds.push(wordId)

        newConfig.wordsById[wordId].blockId = blockId
        wordCount++
    })


    newConfig.blocksById = blocksById
    newConfig.blockIds = blockIds

    // newConfig.captions = newConfig.wordIds.map(wordId => {
    //     const w = newConfig.wordsById[wordId]
    //     return {
    //         word: w.word,
    //         startMs: w.start * 1000,
    //         endMs: w.end * 1000
    //     }
    // })

    return newConfig
}


const FFTJob = async (job) => {

    let clip

    try {

        const {clipId} = job.data

        clip = await models.Clip.findById(clipId)

        const audioUrl = clip.audioUrl.includes('http')? clip.audioUrl:getPublicUrl(clip.audioUrl)

        const newConfig = Object.assign({}, clip.config)

        job.progress(70)

        const feedId = clip.FeedId || -1
        const wavPath = await prepareForFFT(audioUrl)
        const destPath = `/f/frequencies/frequencies-${clip.id}-1.bin`

        const totalDuration = await getFFT(wavPath, destPath)

        newConfig.fftVersion = 3
        newConfig.fftData = destPath

        job.progress(90)

        await clip.update({
            config: newConfig,
            totalDuration,
            status: 'ready'
        })

        job.progress(100)

        return Promise.resolve({path: destPath})
    }
    catch(e) {
        console.error('Error while running the fft job ')
        console.error(e)

        if (clip) {
            await clip.update({
                status: 'ready'
            })
        }

        return Promise.reject(e)
    }
}


const TranscriptJob = async (job) => {

    let clip

    try {

        console.log('NEW TRANSCRIPT JOB : ' + JSON.stringify(job.data))
        const {clipId, userId} = job.data

        clip = await models.Clip.findById(clipId)

        if (userId) {
            const userClip = models.UserClip.findOne({
                where: {
                    UserId: userId,
                    ClipId: clipId,
                    role: 'owner'
                }
            })

            if (!userClip) {
                new Error('Clip is not available')
            }
        }

        const audioUrl = clip.audioUrl.includes('http')? clip.audioUrl:getPublicUrl(clip.audioUrl)

        if (!audioUrl.includes('mp3')) {
            const mp3LocalPath = await convertToMp3(audioUrl)
            const mp3RemotePath = `/s/${clip.PodcastId}/${userId}_${uuidV4()}.mp3`

            const upload = new Transfer({
                path: mp3LocalPath,
                progress: progress => {}
            })

            await upload.saveToBucket(mp3RemotePath)
            await clip.update({audioUrl: mp3RemotePath})
        }

        const flacLocalPath = await prepareForTranscript(audioUrl)
        const flacRemotePath = `/audio_tmp/${clip.id}_flac.flac`

        const upload = new Transfer({
            path: flacLocalPath,
            progress: progress => job.progress(20 + Math.floor((progress) * 20))
        })

        await upload.saveToBucket(flacRemotePath)

        job.progress(50)

        const words = await requestTranscript(flacRemotePath, job)

        let transcriptConfig = {words: words}
        if (userId) {
            transcriptConfig = getCleanConfig(transcriptConfig)
        }

        const newConfig = Object.assign({}, clip.config, transcriptConfig)

        job.progress(70)

        const feedId = clip.FeedId || -1
        const wavPath = await prepareForFFT(audioUrl)
        const destPath = `/f/${feedId}/frequencies/frequencies-${clip.id}.bin`

        const totalDuration = await getFFT(wavPath, destPath)

        newConfig.fftVersion = 2
        newConfig.fftData = destPath

        job.progress(90)

        await clip.update({
            config: newConfig,
            totalDuration,
            status: 'ready'
        })

        job.progress(100)

        return Promise.resolve({path: flacRemotePath})
    }
    catch(e) {
        console.error('Error while running the transcript job ')
        console.error(e)

        if (clip) {
            await clip.update({
                status: 'ready'
            })
        }

        return Promise.reject(e)
    }
}

const WaveformJob = async (job) => {
    let clipRecord

    try {
        const {clipId, userId, getTranscript} = job.data

        clipRecord = await models.Clip.findById(clipId)


        peakbuilder('./path/to/audio.mp3').resolve( (peaks) => {
            console.log(peaks);
        }).reject((err)=>{
            console.log(err);
        });

    } catch (e) {
        console.error('Error while running an audio cut job ')
        console.error(e)

        if (clipRecord) {
            await clipRecord.update({
                status: 'ready'
            })
        }

        return Promise.reject(e)
    }
}

const AudioCutJob = async (job) => {

    let clipRecord

    try {
        const {clipId, userId, getTranscript} = job.data

        console.log(clipId, userId, getTranscript)
        clipRecord = await models.Clip.findByPk(clipId)

        let url

        if (clipRecord.originalAudioUrl) {
            url = getPublicUrl(clipRecord.originalAudioUrl)
        }
        else {
            const episodeRecord = await models.Podcast.findById(clipRecord.PodcastId)
            const storedAudioUrl = episodeRecord.metaData && getPublicUrl(episodeRecord.metaData.storedAudio)
            url = storedAudioUrl || episodeRecord.audioUrl.split('?')[0]
        }

        const ext = path.extname(url)
        const masterPath = `${os.tmpdir()}/master_${uuidV4()}${ext}`

        let outputFile = `${os.tmpdir()}/clip_${clipRecord.id}.mp3`
        let remotePath = clipRecord.originalAudioUrl

        //Download original audio file
        const download = new Transfer({
            url: url,
            progress: progress => {
                job.progress(Math.floor((progress) * 20))
            }
        })

        console.log('downloading audio file', url)
        await download.saveToDisk(masterPath)
        console.log('downloaded')

        let localFile = masterPath
        if (clipRecord.start !== null && clipRecord.end !== null) {

            remotePath = `/f/${clipRecord.FeedId}/audio/clip_${clipRecord.id}_cut.mp3`

            //Adjust start/end
            const fade = parseInt(clipRecord.config.fadeDuration) || 0
            const start = Math.max(0, clipRecord.start - fade)
            const end = clipRecord.end + fade

            //Cut the clip with ffmpeg
            await convertAudio(masterPath, outputFile, start, end, fade, job)

            //Save back to storage
            const upload = new Transfer({
                path: outputFile,
                progress: progress => {
                    const jobProgress = 20 + Math.floor((progress) * 40)
                    job.progress(jobProgress)
                }
            })

            await upload.saveToBucket(remotePath, 'audio/mp3')

            localFile = outputFile
        }

        job.progress(20)

        let newConfig = clipRecord.config || {}

        if (getTranscript) {

            await clipRecord.update({
                status: 'transcribing'
            })

            const flacLocalPath = await prepareForTranscript(localFile)
            const flacRemotePath = `/f/${clipRecord.FeedId}/audio_tmp/flac_${clipRecord.id}.flac`

            const uploadFlac = new Transfer({
                path: flacLocalPath,
                progress: progress => job.progress(40 + Math.floor((progress) * 20))
            })

            await uploadFlac.saveToBucket(flacRemotePath)

            const words = await requestTranscript(flacRemotePath, job)

            let transcriptConfig = {words: words}
            if (userId) {
                transcriptConfig = getCleanConfig(transcriptConfig)
            }

            newConfig = Object.assign(newConfig, transcriptConfig)

            //cleanup
            console.log('deleting flac (for transcript)')
            if (fs.existsSync(flacLocalPath)) {
                fs.removeSync(flacLocalPath)
            }

            job.progress(80)
        }

        const wavPath = await prepareForFFT(localFile, clipRecord.isMusic)
        const destPath = `/f/${clipRecord.FeedId}/frequencies/frequencies-${clipRecord.id}.bin`

        const totalDuration = await getFFT(wavPath, destPath)

        newConfig.fftVersion = 2
        newConfig.fftData = destPath

        job.progress(90)

        await clipRecord.update({
            audioUrl: remotePath,
            totalDuration,
            config: newConfig,
            status: 'ready'
        })

        console.log('deleting wav (for fft)')
        if (fs.existsSync(wavPath)) {
            fs.removeSync(wavPath)
        }

        job.progress(100)

        return Promise.resolve({path: remotePath})
    }
    catch(e) {
        console.error('Error while running an audio cut job ')
        console.error(e)

        if (clipRecord) {
            await clipRecord.update({
                status: 'ready'
            })
        }

        return Promise.reject(e)
    }
}

function convertAudio(masterPath, outputFile, start, end, fade) {

    return new Promise(function (fulfill, reject){

        const durationToCut = (end * 1000 - start * 1000) / 1000

        if (!durationToCut) {
            reject('start/end not valid', start, end)
            return
        }

        ffmpeg(masterPath)
            .seekInput(start)
            .duration(durationToCut)
            .audioFilters(`afade=t=in:ss=0:d=${fade}`)
            .audioFilters(`afade=t=out:st=${durationToCut-fade}:d=${fade}`)
            .audioCodec('libmp3lame')
            .on('error', err => reject(err.message))
            .on('progress', progress => {})
            .on('start', commandLine => console.log('Spawned Ffmpeg with command: ' + commandLine))
            .on('end', res => {
                console.log('ffmpeg cut finished')
                fulfill(outputFile)
            })
            .save(outputFile)
    })
}

function prepareForTranscript(path) {
    return new Promise(function (resolve, reject){
        const destPath = `${os.tmpdir()}/flac_${uuidV4()}.flac`

        ffmpeg()
        .on('error', function (err) {
            reject(err)
        })
        .on('end', function () {
            resolve(destPath)
        })
        .input(path)
        .output(destPath)
        .audioFrequency('16000')
        .audioChannels(1)
        .toFormat('flac')
        .run()
    })
}

function prepareForFFT(path, isMusic) {

    console.log('Preparing for FFT isMusic', isMusic)

    return new Promise(function (resolve, reject){
        const destPath = `${os.tmpdir()}/wav_${uuidV4()}.wav`

        ffmpeg()
        .on('error', function (err) {
            reject(err)
        })
        .on('end', function () {
            console.log('file ready for FFT')
            resolve(destPath)
        })
        .input(path)
        .audioFrequency(isMusic? '44100':'22050')
        .audioChannels(1)
        .output(destPath)
        .run()
    })
}

function convertToMp3(path) {
    return new Promise(function (resolve, reject){
        const destPath = `${os.tmpdir()}/mp3_${uuidV4()}.mp3`

        ffmpeg()
        .on('error', function (err) {
            reject(err)
        })
        .on('end', function () {
            resolve(destPath)
        })
        .input(path)
        .output(destPath)
        .run()
    })
}

function getFFT(audioPath, fftPath) {
    return new Promise(function (resolve, reject){

        console.time('fft')

        const audioData = fs.readFileSync(path.resolve(audioPath))

        const rAudioContext = new RenderingAudioContext()
        const source = rAudioContext.createBufferSource()
        const analyser = rAudioContext.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.9

        rAudioContext.decodeAudioData(audioData).then(async (audioBuffer) => {
            source.buffer = audioBuffer
            source.connect(analyser)

            // prepare to render audio
            source.start(0);
            analyser.connect(rAudioContext.destination);

            const frameDuration = Math.ceil(audioBuffer.duration * 1000 / 25);
            const freqData = new Uint8Array(frameDuration * analyser.frequencyBinCount)

            for (let i = 1; i <= frameDuration; i++) {
                let nextTime = 0.025 * (i + 1)

                rAudioContext.processTo(nextTime)

                // get data
                const array = new Uint8Array(analyser.frequencyBinCount)
                analyser.getByteFrequencyData(array)

                const badState = array.every( v => v === 255 )

                if (badState) {
                    array.forEach((v, i) => array[i] = 0)
                }

                const insertIndex = (i-1) * analyser.frequencyBinCount

                freqData.set(array, insertIndex)
            }

            const download = new Transfer({
                buffer: Buffer.from(freqData),
                progress: progress => console.log(progress)
            })

            await download.saveToBucket(fftPath, 'application/octet-stream')

            console.timeEnd('fft')

            resolve(Math.floor(audioBuffer.duration))
        })
    })
}


function toMillisecond(wordTime) {
    return wordTime.seconds * 1000 + wordTime.nanos / 1000000
}



function requestTranscript(path, job) {

    return new Promise(async function (resolve, reject){

        const encoding = 'FLAC'
        const sampleRateHertz = 16000
        const languageCode = job.data.languageCode || 'en-US'
        let speechClient = client

        let config = {
            enableWordTimeOffsets: true,
            encoding: encoding,
            sampleRateHertz: sampleRateHertz,
            languageCode: languageCode,
            enableAutomaticPunctuation: true,
        }

        if (languageCode === 'en-US') {
            config.model = 'latest_long'
        }

        if (job.data.multipleSpeakers) {
            config.enableSpeakerDiarization = true
            config.diarizationSpeakerCount = parseInt(job.data.multipleSpeakers)
            config.model = "phone_call"
            speechClient = clientBeta
        }

        const uri = `gs://${CLOUD_BUCKET}${path}`

        const request = {
            config: config,
            audio: {uri}
        }

        try {
            // Handle the operation using the promise pattern.
            const [operation] = await speechClient.longRunningRecognize(request)
            const [response, metaData, finalApiResponse] = await operation.promise()
            const words = []

            const addResults = result => {
                result.alternatives[0].words.forEach((wordInfo, index) => {
                    // NOTE: If you have a time offset exceeding 2^32 seconds, use the
                    // wordInfo.{x}Time.seconds.high to calculate seconds.
                    const startMs = toMillisecond(wordInfo.startTime)
                    const endMs = toMillisecond(wordInfo.endTime)

                    //console.log(wordInfo)
                    // const previousWord = words[index - 1]
                    // if (previousWord && previousWord.endMs == startMs) {
                    //     startMs += 50
                    // }

                    words.push({
                        word: wordInfo.word, //+ ' ',
                        start: startMs,
                        end: endMs,
                        speakerTag: wordInfo.speakerTag
                    })
                })
            }

            if (job.data.multipleSpeakers) {
                const result = response.results[response.results.length - 1]
                console.log(`Transcription: ${result.alternatives[0].transcript}`)
                addResults(result)
            }
            else {
                response.results.forEach(result => {
                    addResults(result)
                })
            }

            resolve(words)
        }
        catch(er) {
            reject(er)
        }

    })


}


module.exports = {
    AudioCutJob,
    TranscriptJob,
    FFTJob,
    prepareForFFT,
    getFFT,
    convertAudio
}

