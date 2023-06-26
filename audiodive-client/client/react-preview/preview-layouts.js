import React, {useEffect} from 'react'
import VisPreview from '../clip/components/template/vis-preview.jsx'
import ParticlesPreview from '../clip/components/template/particles-preview.jsx'
import TextPreview from '../clip/components/template/text-preview.jsx'
import {fabric} from 'fabric'
import {Utils} from '../shared/utils'
import RATIO from '../shared/video-ratio'
import PreviewMedia from './preview-media'
import mapSeries from "async/mapSeries"
import DynamicArea from "./dynamic-area"
import PreviewProgress from './preview-progress'
import * as d3 from "d3"


const WaterMark = props => {

    const {clip} = props
    const website = clip.Feed && clip.Feed.website || 'website'

    const style = {
        top: '-6px',
        right: '16px',
        position: 'absolute',
        fontFamily: "'Libre Baskerville', 'Nunito', sans-serif",
        fontWeight: '600',
        zIndex: '999',
        fontSize: '29px',
        color: '#fff',
        display: 'flex',
        alignItem: 'center',
        opacity: '0.7'
    }

    const titleStyle = {
        marginTop: '12px',
        marginLeft: '12px',
        textShadow: 'rgb(62 62 62) 0px 0px 3px'
    }

    const imgStyle = {
        filter: 'drop-shadow(0px 0px 2px #777)'
    }

    return <div style={style}>
        <div id={'logo-text'} style={titleStyle}>{website}</div>
    </div>
}




export default class PreviewLayouts extends React.Component {

    constructor() {
        super();

        this.layoutLoaded = false

        this.state = {}
        this.canvas = {};
        this.loadedLayouts = {}
        this.loadedTemplateImages = {}
        this.bindRenderLayout = this.renderLayout.bind(this)
    }

    componentDidMount() {
        console.log('layout mounted');

        const layouts = Object.keys(this.props.layouts).map(layoutId => {

            const layoutConfig = this.props.layouts[layoutId][this.props.ratioConfig]
            layoutConfig.layoutId = parseInt(layoutId)

            const canvasObject = []

            layoutConfig.medias = []
            layoutConfig.canvas.objects.forEach((obj, index) => {

                const box = {
                    type: obj.type,
                    name: obj.name,
                    left: Math.round(obj.left),
                    top: Math.round(obj.top),
                    width: Math.round(obj.width * obj.scaleX),
                    height: Math.round(obj.height * obj.scaleY),
                    angle: obj.angle,
                    zIndex: 30 + index
                }

                const synced = layoutConfig.linkedElements[obj.id]

                if (!synced) return

                if (obj.type === 'image' || obj.type === 'image2') {

                    let media = {
                        id: obj.id,
                        imageStyle: {
                            ...box,
                            opacity: synced.opacity,
                            borderRadius: synced.borderRadius
                        },
                        url: synced.src || obj.src || synced.imgSrc,
                        ...synced
                    }

                    if (!media.hide) {
                        layoutConfig.medias.push(media)
                        this.loadedTemplateImages[media.id] = false
                    }

                    if (synced.visualization) {
                        const {property, frequencyBin, amplitude} = synced.visualization
                        media.visualization = {
                            property,
                            amplitude,
                            frequencyBin,
                            scale: d3.scaleLinear().range([1 - amplitude, 1]).domain([0, 256])
                        }
                    }
                }

                layoutConfig.linkedElements[obj.id] = {
                    ...synced,
                    ...box
                }
            })

            return layoutConfig
        })

        let callback = () => {}
        const layoutsObj = {}
        layouts.forEach(layout => {
            this.loadedLayouts[layout.layoutId] = false
            layoutsObj[layout.layoutId] = layout
            if (!layout.medias.length) {
                callback = this.props.onLayoutReady.bind(this, layout.layoutId)
            }
        })

        const {clip, timeline} = this.props
        const speakerRange = Utils.getSpeakerRanges(clip.config)

        this.setState({
            layouts: layoutsObj,
            speakerRange
        }, callback)

        setTimeout(() => {
            const imgElement = document.getElementById('logo-img')
            const logoElement = document.getElementById('logo-text')

            const split = new SplitText(logoElement, {type:"chars"})
            split.chars.forEach((char, index) => {

                let start = 15 + index * 2

                timeline.from(char, 10, {opacity:0, force3D:true, y:-30}, start);

            })

            //timeline.from(imgElement, 15, { force3D:true, opacity:0, scale: 0}, 1);

        },10)

    }

    onMediasReady() {
        this.mediasLoaded = true
        this.checkStatus()
    }

    checkStatus() {

        const allLoaded = Object.keys(this.loadedTemplateImages).reduce((prev, mediaId) => {
            const loaded = this.loadedTemplateImages[mediaId]
            return prev && loaded
        }, true)

        console.log('template loaded', allLoaded.toString())

        allLoaded && this.mediasLoaded && this.props.onLayoutReady()
    }

    mediaLoaded(id) {

        this.loadedTemplateImages[id] = true
        this.checkStatus()


    }

    getLayoutId(props) {
        const {block, defaultLayoutId} = props
        return (block && block.layout) || defaultLayoutId
    }

    showLayout(layoutId, frame, previousLayoutId) {

        const {speakerRange} = this.state
        const {timeline} = this.props
        console.log('show', layoutId, frame, speakerRange)

        const viewport = this.getViewPortBounds()
        const layout = this.state.layouts[layoutId]

        if (!layout) {
            return
        }

        Object.entries(layout.linkedElements).forEach(([key, linkedElement]) => {

            const element = document.getElementById(key + layoutId)

            if (!element) {
                return
            }

            element.style.visibility = 'visible'

            const {showTransition, hideTransition} = linkedElement

            if (showTransition) {

                if (linkedElement.speaker && speakerRange) {
                    speakerRange.forEach(range => {
                        if (range.speakerTag === linkedElement.speaker) {
                            Utils.animateElement(element, linkedElement, showTransition, viewport, true, timeline, range.start, true)
                        }
                    })
                }
                else {
                    const blockId = (this.props.block? this.props.block.id: 0)

                    if (blockId) {
                        const layoutRange = this.props.blockIdToScheduledLayout[blockId]

                        let startTime = layoutRange.start
                        if (showTransition.delay) {
                            startTime = (showTransition.showEvent === 'beforeEnd'?
                                    layoutRange.end - Number(showTransition.duration) - Number(showTransition.delay)
                                    :
                                    layoutRange.start + Number(showTransition.delay)
                            )
                        }

                        //because we are passing the start as a frame directly we don't need to set isFrame
                        Utils.animateElement(element, linkedElement, showTransition, viewport, true, timeline, startTime, true)
                        console.log(showTransition, startTime)
                    }



                }
            }

            if (hideTransition) {

                const blockId = (this.props.block? this.props.block.id: 0)

                if (blockId) {
                    const layoutRange = this.props.blockIdToScheduledLayout[blockId]

                    const time = hideTransition.hideEvent === 'beforeEnd'? Number(layoutRange.end) - Number(hideTransition.duration) : Number(layoutRange.start) + Number(hideTransition.offset)

                    if (linkedElement.speaker && speakerRange) {
                        speakerRange.forEach(range => {
                            if (range.speakerTag === linkedElement.speaker) {
                                Utils.animateElement(element, linkedElement, hideTransition, viewport, false,  timeline, Number(range.end) - Number(hideTransition.duration), true)
                            }
                        })
                    }
                    else {
                        Utils.animateElement(element, linkedElement, hideTransition, viewport, false, timeline, time, true)
                    }
                }


            }
        })

        const layoutElement = document.getElementById('layout-' + layoutId)
        if (layout.showTransition) {
            Utils.animateElement(layoutElement, viewport, layout.showTransition, viewport, true, timeline, frame * .025, true)
        }
        else {
            layoutElement.style.opacity = 1
        }
        if (layout.hideTransition) {
            //Utils.animateElement(layoutElement, viewport, transitionObject, viewport, false, this.state.timeline, frame)
        }
    }

    componentDidUpdate(prevProps) {

        const currentLayoutId = this.getLayoutId(this.props)
        const previousLayoutId = this.getLayoutId(prevProps)
        let {currentFrame, range} = this.props

        let startFrame = 1

        if (range)
            startFrame = Utils.getFrameNumberFromTime(parseFloat(range.start) * 1000) + 1

        if (currentLayoutId !== previousLayoutId) {
            this.showLayout(currentLayoutId, currentFrame, previousLayoutId)
        }
        else if (currentFrame === startFrame) {
            this.showLayout(currentLayoutId, currentFrame, previousLayoutId)
        }

        if (prevProps.currentFrame !== currentFrame) {
            this.props.timeline.seek(currentFrame)
        }
    }

    getViewPortBounds() {
        const {ratioConfig} = this.props
        const {width, height} = RATIO.DIMENSIONS[ratioConfig]

        return {
            x: 0,
            y: 0,
            width: width,
            height: height
        }
    }

    renderLayout(layoutId) {

        const {ratioConfig, clipConfig, currentFrame, clip, customContent, onlyShowBlocks} = this.props
        const viewport = this.getViewPortBounds()

        let currentLayoutId = this.getLayoutId(this.props)

        const currentLayout = this.props.layouts[currentLayoutId]
        const currentLayoutConfig = currentLayout[ratioConfig]
        const {backgroundColor, backgroundImage} = currentLayoutConfig

        const id = 'canvas-' + layoutId

        const layoutConfig = this.state.layouts[layoutId]
        const {dynamicArea} = layoutConfig.linkedElements

        const isActive = currentLayoutId === layoutConfig.layoutId

        const layoutsStyle = {
            backgroundColor: backgroundColor,
            backgroundImage: backgroundImage && `url(${backgroundImage})`,
            backgroundSize: 'contain',
            height: `${viewport.height}px`,
            width: `${viewport.width}px`,
            overflow: 'hidden',
            zIndex: isActive?2:1
        }

        const showBg = backgroundColor || backgroundImage

        //console.log('layout', props.block, visArea, isActive)
        return (<div
            id={`layout-${layoutId}`}
            key={id}
            style={layoutsStyle}
            className='layout-container'>

            {
                !clip.unlocked &&
                <WaterMark clip={clip} />
            }

            {
                isActive && Object.entries(layoutConfig.linkedElements).map(
                    ([key, element], index, original) => {


                        if (element.hide) {
                            return <span id={key + layoutId} key={key} />
                        }

                        switch (key) {

                            //Transcript container
                            case 'textArea':

                                if (!clipConfig.wordsById)
                                    return <span />

                                return <TextPreview
                                    id={key + layoutId}
                                    key={key}
                                    textArea={element}
                                    selectedBlock={this.props.block}
                                    currentFrame={this.props.currentFrame}
                                    ratioConfig={ratioConfig}
                                    viewMode={true}
                                    playing={true}
                                    blocksById={clipConfig.blocksById}
                                    blockIds={clipConfig.blockIds}
                                    allWordsById={clipConfig.wordsById}
                                    onlyShowBlocks={onlyShowBlocks}
                                />

                            //Visualization container
                            case 'visArea':
                                return <VisPreview
                                    id={key + layoutId}
                                    key={key}
                                    visArea={element}
                                    audioData={this.props.audioData}
                                    isMusic={clip.isMusic}
                                />

                            //Particles container
                            case 'particles':
                                return <ParticlesPreview
                                    id={key + layoutId}
                                    key={key}
                                    area={element}
                                    audioData={this.props.audioData}
                                    isPreview={true}
                                    currentFrame={currentFrame}
                                />

                            //Progress Bar
                            case 'progress':
                                return <PreviewProgress
                                    id={'progress' + layoutId}
                                    key={key}
                                    config={element}
                                />

                        }

                        switch (element.type) {

                            case 'htmlText':

                                let styles = Utils.getStyles(element)
                                let content = element.content && element.content.replace('{clipName}', this.props.clip.name)
                                if (customContent && customContent[element.name]) {
                                    content = customContent[element.name]
                                }

                                return <div
                                    id={key + layoutId}
                                    key={key}
                                    style={styles}
                                    className='element'>
                                    {content}
                                </div>
                        }

                        return <span key={key} />
                    }
                )
            }

            {
                isActive &&
                <DynamicArea
                    layoutId={layoutId}
                    ratioConfig={ratioConfig}
                    onMediasReady={this.onMediasReady.bind(this)}
                    medias={this.props.medias}
                    dynamicArea={dynamicArea}
                    currentFrame={this.props.currentFrame}
                />
            }

            {
                layoutConfig.medias &&
                <div>
                    {
                        layoutConfig.medias && layoutConfig.medias.map(media =>
                            <PreviewMedia
                                currentFrame={this.props.currentFrame}
                                id={'media_preview_'+ media.id}
                                key={media.id}
                                media={media}
                                mediaLoaded={this.mediaLoaded.bind(this)}
                                audioData={this.props.audioData}
                            />
                        )
                    }
                </div>

            }

        </div>)
    }

    render() {
        const viewport = this.getViewPortBounds()

        const layoutStyles = {
            height: `${viewport.height}px`,
            width: `${viewport.width}px`,
        }

        return (
            <div id={'layouts'} style={layoutStyles} >
                {
                    this.state.layouts && Object.keys(this.state.layouts).map(this.bindRenderLayout)
                }
            </div>
        )
    }
}