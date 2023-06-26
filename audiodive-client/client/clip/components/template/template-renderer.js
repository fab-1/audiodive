import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Utils} from "../../../shared/utils"
import SHAPES from "./shapes"
import TextPreview from './text-preview.jsx'
import VisPreview from './vis-preview.jsx'
import ParticlesPreview from './particles-preview.jsx'
import PreviewProgress from '../../../react-preview/preview-progress'
import RATIO from "../../../shared/video-ratio"
import WebfontLoader from 'webfontloader'
import * as d3 from 'd3'

class TemplateRenderer extends Component {


    componentDidMount() {
        this.initVisualizedElements()
        document.addEventListener('fftDataUpdate', this.dataUpdated)
    }

    componentWillUnmount() {
        document.removeEventListener('fftDataUpdate', this.dataUpdated)
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.template !== this.props.template) {
            this.initVisualizedElements()
        }
    }

    initVisualizedElements() {

        let visualizedElements = {}
        const {template, activeRatio} = this.props

        let config = template[activeRatio]
        for (let id in config.linkedElements) {
            const element = config.linkedElements[id]

            if (element && element.visualization) {
                const {property, frequencyBin, amplitude} = element.visualization
                visualizedElements[id] = {
                    property,
                    frequencyBin,
                    scale: d3.scaleLinear().range([1 - amplitude, 1]).domain([0, 256])
                }
            }

        }

        this.setState({visualizedElements})
    }

    dataUpdated = data => {

        const {visualizedElements} = this.state

        for (let id in visualizedElements) {
            const visConfig = visualizedElements[id]
            const value = data.detail[visConfig.frequencyBin]
            const styleValue = visConfig.scale(value)
            const elem = document.getElementById(id)
            elem.style.transform = `scale(${styleValue})`
        }

    }

    loadFont(textObject) {

        const {fonts} = this.props

        const fontObject = fonts.find(font => font.fontFamily === textObject.fontFamily)

        if (!fontObject) return

        let {fontFamily, cssUrl} = fontObject
        let fontLoaderConfig = {}

        if (cssUrl) {

            WebfontLoader.load({
                custom: {
                    families: [fontFamily],
                    urls: [cssUrl]
                }})
        }
        else {

            let [defaultVariant] = fontObject.variants
            if (fontObject.variants.length === 1 && defaultVariant !== 'regular') {
                fontFamily = `${fontFamily}:${defaultVariant}`
            }
            else if (fontObject.variants.includes(textObject.fontWeight)) {
                fontFamily = `${fontFamily}:${textObject.fontWeight}`
                fontLoaderConfig.weight = textObject.fontWeight
            }

            const conf = {families: [fontFamily]}

            WebfontLoader.load({
                google: conf
            })

        }

        //
        // fontLoader.load().then(() => {
        //     console.log(`font ${fontFamily} loaded`)
        // }).
        // catch((err) => {console.error(err)})
    }

    getElements(){

        const {template, activeRatio} = this.props
        let layoutConfig = template[activeRatio]

        const elements = layoutConfig.linkedElements || layoutConfig
        //const {dynamicArea, textArea, visArea} = elements
        const sourceObjects = layoutConfig.canvas.objects

        let objects = sourceObjects.map((object, index, original) => {

            //we need to find the correct zIndex, however dynamic media should always be after text in editor

            const linkedElement = elements[object.id]
            return {
                ...linkedElement,
                id: object.id,
                name: object.name,
                type: object.type,
                top: object.top,
                left: object.left,
                width: Math.round(object.width * object.scaleX),
                height: Math.round(object.height * object.scaleY),
                angle: object.angle,
                src: linkedElement.src || linkedElement.imgSrc || object.src,
                zIndex: index + 1
            }
        })

        if (!sourceObjects.find(obj => obj.id === SHAPES.DYNAMIC)) {

            const viewport = RATIO.DIMENSIONS[activeRatio]

            //Add mask (container) for medias overlays
            objects.push({
                id: SHAPES.DYNAMIC,
                zIndex: objects.length,
                ...viewport
            })
        }

        return objects
    }

    render() {

        const {
            activeRatio,
            selectedBlock,
            selectedWord,
            viewMode,
            onWordChange,
            onWordSelect,
            template,
            renderMedias,
            playing,
            selectedMediaId,
            clip,
            isMusic,
            showOverflow,
            customContent,
            onlyShowBlocks
        } = this.props

        const getHtmlTextContent = (object) => {

            //if (!viewMode) return object.content

            if (customContent && customContent[object.name]) {
                return customContent[object.name]
            }

            if (object.content) {
                return object.content.replace('{clipName}', clip && clip.name)
            }

            return ''
        }

        const objects = this.getElements()

        let layoutConfig = template[activeRatio]
        const {linkedElements} = layoutConfig

        const {backgroundColor, backgroundImage} = layoutConfig

        const {blocksById, blockIds, wordsById} = clip.config

        const cameraStyle = {
            backgroundColor: backgroundColor || '#FFF',
            backgroundImage: backgroundImage && `url(${backgroundImage})`,
            backgroundSize: 'contain',
            height: '100%'
        }


        return (

                <div className='camera' style={cameraStyle}>
                    {
                        objects.map(object => {

                            const linkedElement = linkedElements[object.id]



                            let styles = Utils.getStyles(object)
                            const key = object.id + activeRatio// + viewMode.toString()

                            if (object.id === SHAPES.DYNAMIC && selectedMediaId) {
                                styles.zIndex = 100
                            }

                            if (object.hide) {
                                return <span key={object.id} id={object.id} />
                            }

                            if (showOverflow && SHAPES.DYNAMIC === object.id) {
                                styles.overflow = 'visible'
                            }

                            switch(object.id) {

                                case SHAPES.TEXT:

                                    if (blocksById)
                                        return <TextPreview
                                            id={object.id}
                                            key={object.id}
                                            playing={playing}
                                            textArea={object}
                                            allWordsById={wordsById}
                                            selectedWord={selectedWord}
                                            selectedBlock={selectedBlock}
                                            activeBlock={selectedBlock}
                                            blocksById={blocksById}
                                            blockIds={blockIds}
                                            viewMode={viewMode}
                                            onWordChange={onWordChange}
                                            onWordSelect={onWordSelect}
                                            onlyShowBlocks={onlyShowBlocks}
                                        />
                                    else
                                        return <div />

                                case SHAPES.VISUALIZATION:
                                    return <VisPreview
                                        isMusic={isMusic}
                                        id={object.id}
                                        viewMode={viewMode}
                                        key={object.id + activeRatio}
                                        visArea={object}
                                        originalElement={linkedElement} //we use that to check whether the element was updated
                                    />

                                case SHAPES.PARTICLES:
                                    return <ParticlesPreview
                                        id={object.id}
                                        viewMode={viewMode}
                                        key={object.id + activeRatio}
                                        area={object}
                                        originalElement={linkedElement} //we use that to check whether the element was updated
                                    />

                                case SHAPES.PROGRESS:
                                    return <PreviewProgress
                                        id={object.id}
                                        key={object.id + activeRatio}
                                        config={object}
                                        editMode={!viewMode}
                                    />

                                case SHAPES.DYNAMIC:
                                    return <div
                                        id={object.id}
                                        key={object.id + activeRatio}
                                        className="layout-editor-dynamic-view-mode"
                                        style={styles}>

                                        {viewMode && renderMedias}
                                    </div>
                            }

                            switch (object.type) {

                                case SHAPES.HTML_TEXT:
                                    return <div
                                        id={object.id}
                                        key={key}
                                        className="layout-editor-dynamic-view-mode"
                                        style={styles}>
                                        {getHtmlTextContent(object)}
                                    </div>

                                case SHAPES.IMAGE:

                                    return <div
                                        id={object.id}
                                        key={key}
                                        className="layout-editor-dynamic-view-mode"
                                        style={styles}>
                                        <img
                                            height={object.height}
                                            width={object.width}
                                            src={object.src}
                                        />
                                    </div>

                                case SHAPES.IMAGE2:

                                    return <div
                                        id={object.id}
                                        key={key}
                                        className="layout-editor-dynamic-view-mode"
                                        style={styles}>
                                        <img
                                            height={object.height}
                                            width={object.width}
                                            src={object.imgSrc}
                                        />
                                    </div>

                                case 'custom':
                                    return <div
                                        id={object.id}
                                        key={key}
                                        className="layout-editor-dynamic-view-mode"
                                        style={styles}>
                                    </div>
                            }


                        })
                    }
                </div>
        )
    }
}

TemplateRenderer.propTypes = {};

export default TemplateRenderer;