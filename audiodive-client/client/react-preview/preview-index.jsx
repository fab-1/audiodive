import React from 'react'
import PreviewLayouts from './preview-layouts.js'
import DynamicArea from './dynamic-area.js'
import http from 'axios'
import * as d3 from 'd3'
import RATIO from '../shared/video-ratio'
import {Utils} from '../shared/utils'

export default class PreviewIndex extends React.Component {

    constructor(){
        super()

        const url = new URL(window.location.href);
        const blocks = url.searchParams.get('blocks')
        const customContent = url.searchParams.get('customContent')
        const customRange = url.searchParams.get('customRange')
        const duration = url.searchParams.get('duration')

        this.ratioConfig = RATIO.PARAM_TO_CONFIG[url.searchParams.get('ratio')]

        this.state = {
            frameCount: 0,
            currentFrame: 0,
            text: '',
            currentBlock: null,
            currentWordIndex: -1,
            currentTime: 0,
            medias:[],
            customContent: customContent? JSON.parse(customContent) : null,
            range: customRange? JSON.parse(customRange) : null,
            onlyShowBlocks: blocks? blocks.split(',') : null,
            duration: Number(duration)
        }

        this.layoutInstancesById = {}
        this.timeline = gsap.timeline({
            paused:true,
            useFrames: true
        })
    }

    componentDidMount() {

        if (this.ratioConfig) {
            this.layouts = this.props.layouts;
            this.clip = this.props.clip;
            this.clipConfig = this.clip.config;

            // if (!this.state.range)
            //     this.state.range = this.getCustomRange(this.state.onlyShowBlocks)

            this.init()
        }
        else {
            console.error('Cannot initialize')
        }
    }

    // getCustomRange(onlyShowBlocks) {
    //
    //     if (!onlyShowBlocks)
    //         return null
    //
    //     const {blocksById, wordsById, wordIds, blockIds} = this.clipConfig
    //
    //     const firstBlock = blocksById[onlyShowBlocks[0]]
    //     const lastBlock = blocksById[onlyShowBlocks[onlyShowBlocks.length - 1]]
    //     const firstWord = wordsById[firstBlock.wordIds[0]]
    //     const lastWord = wordsById[lastBlock.wordIds[lastBlock.wordIds.length - 1]]
    //
    //     const range = {
    //         start: firstWord.start,
    //         end: lastWord.end,
    //         durationMs: lastWord.end * 1000 - firstWord.start * 1000
    //     }
    //
    //     return range
    // }

    init() {

        if (!this.state.duration)
            this.initAudio()
        else {
            this.initConfig()
            this.initVisual()
        }

        if (this.state.range)
            this.seek(this.getFrameNumberFromTime(this.state.range.start * 1000))
    }

    getFrameNumberFromTime(ms) {
        return Math.floor(ms/25);
    }

    initAudio(){

        this.audioCtx = new AudioContext();

        http({method:'get', url: this.clip.audioUrl, responseType:'arraybuffer'}).
        then(res => {
            return this.decodeAudio(res.data)
        }).
        then(buffer => {
            this.buffer = buffer

            this.initConfig()
            this.initVisual()
        })
    }

    decodeAudio(data){
        return new Promise((resolve, reject) => {
            this.audioCtx.decodeAudioData(data, buffer => resolve(buffer))
        })
    }

    initConfig() {

        let {range, duration} = this.state

        let start = 0
        let end = duration

        if (!duration) duration = this.buffer.duration
        const durationMs = duration * 1000
        const frameCount = Math.ceil(durationMs / 25)

        if (range) {
            start = range.start
        }

        const {mediasById, blocksById, wordsById, globalSettings} = this.clipConfig

        let medias = []
        for (let mediaId in mediasById) {
            medias.push(mediasById[mediaId])
        }

        let sortedWords = [],
            sortedBlocks = [],
            blockIdToScheduledLayout = {}

        if (wordsById) {
            const wordEntries = Object.entries(wordsById)
            wordEntries.sort((entry1, entry2) => {
                return entry1[1].start - entry2[1].start
            })

            sortedWords = wordEntries.map(entry => entry[1])
            //sortedWords[sortedWords.length - 1].end = duration

            let currentBlock = {
                block: blocksById[sortedWords[0].blockId],
                start
            }

            sortedBlocks = [currentBlock]

            sortedWords.forEach((word, index) => {
                if (word.blockId !== currentBlock.block.id) {

                    currentBlock.end = word.start

                    currentBlock = {
                        start: word.start,
                        block: blocksById[word.blockId]
                    }

                    sortedBlocks.push(currentBlock)
                }

                if (index === sortedWords.length - 1) {
                    currentBlock.end = word.end
                }
            })


            const getLayoutId = block => block.layout? block.layout:this.clip.TemplateId

            let currentLayout = {
                id: getLayoutId(sortedBlocks[0].block),
                start
            }

            //represents the effective time range of a specific layout in the context of the whole clip
            let scheduledLayouts = [currentLayout]

            sortedBlocks.forEach((sortedBlock, index) => {

                const layoutId = getLayoutId(sortedBlock.block)

                if (layoutId !== currentLayout.id) {
                    currentLayout.end = sortedBlock.start

                    currentLayout = {
                        start: sortedBlock.start,
                        id: layoutId
                    }

                    scheduledLayouts.push(currentLayout)
                }

                if (index === sortedBlocks.length - 1) {
                    currentLayout.end = sortedBlock.end
                }

                if (range) {
                    currentLayout.end = range.end
                }

                //save shortcut so we can easily find out the overall layout timing for a specific block
                blockIdToScheduledLayout[sortedBlock.block.id] = currentLayout
            })
        }
        else {
            blockIdToScheduledLayout = {
                1: {
                    id: 1,
                    layout: globalSettings.layoutId || this.clip.TemplateId,
                    start,
                    end
                }
            }
        }

        console.log(blockIdToScheduledLayout)

        this.setState({
            medias,
            sortedWords,
            sortedBlocks,
            frameCount,
            duration,
            blockIdToScheduledLayout
        })
    }

    initVisual() {
        if (this.clipConfig.fftData) {
            http.get(`https://storage.googleapis.com/bucket-name${this.clipConfig.fftData}`, {responseType:'arraybuffer'})
                .then(res => {
                    this.freqData = new Uint8Array(res.data)
                    //this.fillData()

                    console.log('audio ready')

                    this.audioReady = true
                    this.checkStatus()
                })
                .catch(e => {
                    this.audioReady = true
                    this.checkStatus()
                })
        }
        else {
            this.audioReady = true
            this.checkStatus()
        }
    }

    getFreqDataForFrame(frameNumber) {
        const freqIndex = 256 * frameNumber;
        return this.freqData.slice(freqIndex, freqIndex + 256)
    }

    getTextBlockForTime(timeMS) {

        //const timeMS = Math.floor(time * 1000);
        const wordsArray = this.clipConfig.wordIds;

        //if there is no words we return a dummy block
        if (!wordsArray) return {
            id: 1,
            layout: this.clipConfig.globalSettings.layoutId,
            wordObjects: []
        }

        let word = null;
        for (let index = 0; index < wordsArray.length; index++) {
            word = this.clipConfig.wordsById[wordsArray[index]]
            const wordEndMs = word.end * 1000

            if (wordEndMs > timeMS) {
                break;
            }
        }

        const currentBlock = this.clipConfig.blocksById[word.blockId];
        currentBlock.wordObjects = currentBlock.wordIds.map(wordId => {
            return this.clipConfig.wordsById[wordId];
        })

        return currentBlock;
    }


    onLayoutReady() {
        console.log('layouts ready')
        this.layoutsReady = true
        this.checkStatus()
    }



    checkStatus() {
        console.log(this.audioReady, this.layoutsReady)
        if (this.audioReady && this.layoutsReady) {
            this.props.onPreviewReady()

            this.initTimeline()
            //this.setCustomRange()
        }
    }

    initTimeline() {

        console.log('initTimeline')
        const layoutId = this.clip.TemplateId || this.clipConfig.globalSettings.layoutId

        const template = this.layouts[layoutId]
        const {textArea} = template[this.ratioConfig].linkedElements

        const viewport = RATIO.DIMENSIONS[this.ratioConfig]
        //const wordsTimeline = this.wordsTimeline

        Utils.addWordsToTimeline({
            wordsTimeline: this.timeline,
            viewport,
            config: this.clipConfig,
            textArea,
            isFrame: true,
            noInitDelay: true
        })
    }

    seek(number) {
        this.setState({
            currentFrame: number
        }, this.nextStep)
    }

    isReady() {
        return this.state.currentFrame === this.state.frameCount - 1;
    }

    nextStep() {

        if (this.state.currentFrame === this.state.frameCount) {
            return Promise.resolve();
        }

        const currentTime = (this.state.currentFrame + 1) * 25;
        const currentBlock = this.getTextBlockForTime(currentTime);
        const nextBlock = this.getTextBlockForTime(currentTime + 100);

        const timeInSec = currentTime / 1000;
        //console.log('time: ', timeInSec);
        //this.audioElement.currentTime = timeInSec;

        const freqData = this.freqData && this.getFreqDataForFrame(this.state.currentFrame + 1);

        document.dispatchEvent(new CustomEvent('progress', {detail: this.state.currentFrame / this.state.frameCount}))

        return new Promise(resolve =>
            this.setState(
                {
                    currentBlock: currentBlock,
                    nextBlock: nextBlock,
                    currentFrame: this.state.currentFrame + 1,
                    currentTime: currentTime,
                    audioData: freqData
                }, () => {

                    if (window.particleContainer)
                        window.particleContainer.draw3(() => resolve())
                    else
                        resolve()
                }
            )
        )
    }

    render() {

        const {blockIdToScheduledLayout, currentBlock, currentFrame, audioData, medias, customContent, onlyShowBlocks, range} = this.state
        const {clip} = this.props
        const layoutId = clip.TemplateId || this.clipConfig.globalSettings.layoutId



        return (
            <div id="app">

                {
                    this.clipConfig && this.layouts && blockIdToScheduledLayout &&
                    <PreviewLayouts
                        ratioConfig={this.ratioConfig}
                        defaultLayoutId={layoutId}
                        onLayoutReady={this.onLayoutReady.bind(this)}
                        block={currentBlock}
                        layouts={this.layouts}
                        currentFrame={currentFrame}
                        audioData={audioData}
                        medias={medias}
                        clip={clip}
                        blockIdToScheduledLayout={blockIdToScheduledLayout}
                        clipConfig={this.clipConfig}
                        timeline={this.timeline}
                        customContent={customContent}
                        onlyShowBlocks={onlyShowBlocks}
                        range={range}
                    />
                }
            </div>
        )
    }
}