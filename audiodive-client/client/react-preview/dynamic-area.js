import React from 'react'
import {Utils} from '../shared/utils'
import PreviewMedia from './preview-media'
import RATIOS from '../shared/video-ratio'


export default class DynamicArea extends React.Component {

    constructor() {
        super()

        this.loadedImages = {}

        //ANIMATIONS
        this.timeline = gsap.timeline({
            paused: true,
            useFrames: true
        })
    }

    componentDidMount() {
        if (!this.props.medias || !this.props.medias.length) {
            this.props.onMediasReady()
        }

        this.props.medias.forEach(media => {
            this.loadedImages[media.id] = false
        })
    }

    componentDidUpdate(prevProps) {
        if (prevProps.currentFrame !== this.props.currentFrame) {
            this.timeline.seek(this.props.currentFrame)
        }
    }

    mediaLoaded(id) {

        this.loadedImages[id] = true

        const allLoaded = Object.keys(this.loadedImages).reduce((prev, mediaId) => {
            const loaded = this.loadedImages[mediaId]
            return prev && loaded
        }, true)

        console.log('loaded', id, allLoaded.toString())

        if (allLoaded) {
            this.props.onMediasReady()
        }
    }

    render() {

        let {dynamicArea, medias, ratioConfig, currentFrame, layoutId} = this.props

        if (!dynamicArea) {
            dynamicArea = RATIOS.DIMENSIONS[ratioConfig]
        }

        const style = Utils.getStyles(dynamicArea)

        return (<div className={'dynamic-area'} style={style}>
            <div>
                {
                    medias && medias.map(media =>
                        <PreviewMedia
                            currentFrame={currentFrame}
                            id={'media_preview_'+ media.id}
                            key={media.id}
                            media={media}
                            mediaLoaded={this.mediaLoaded.bind(this)}
                            audioData={this.props.audioData}
                        />
                    )
                }
            </div>
        </div>)
    }
}