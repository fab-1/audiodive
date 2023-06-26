import React, {Component} from 'react'
import Gif from '../vendor/gif/react-gif'
import PropTypes from 'prop-types'
import {Utils} from "../shared/utils"
import * as d3 from "d3"

class PreviewMedia extends Component {

    constructor() {
        super()
        this.state = {}
    }

    mediaLoaded(id) {
        this.props.mediaLoaded(id)

        const {media} = this.props
        if (media.visualization) {
            const {property, frequencyBin, amplitude} = media.visualization

            let visualization = {
                property,
                frequencyBin,
                amplitude,
                scale: d3.scaleLinear().range([1 - amplitude, 1]).domain([0, 256])
            }

            this.setState({
                visualization
            })
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const {id} = this.props
        //console.log(this.state)

        if (prevProps.audioData !== this.props.audioData && this.state.visualization) {
            const value = this.props.audioData[this.state.visualization.frequencyBin]
            const styleValue = this.state.visualization.scale(value)
            const elem = document.getElementById(id)
            elem.style.transform = `scale(${styleValue})`
        }
    }

    render() {

        const {media} = this.props
        const {gifSettings, imageStyle, url, general} = media

        const ext = url.split('.').pop()
        const isGif = ext === 'gif'

        let style = Utils.getStyles(media.imageStyle)
        if (general && general.zIndex) {
            style.zIndex = 1 + general.zIndex
        }

        const startFrame = general? Utils.getFrameNumberFromTime(parseFloat(general.time) * 1000):1

        //console.log(media.id, this.props.currentFrame, isGif)

        return (
            <div
                id={this.props.id}
                key={'m-' + media.id}
                className={'bg-element media-' + media.id}
                style={style}>
                {
                    isGif?
                        <Gif
                            onLoad={this.mediaLoaded.bind(this, media.id)}
                            pingPong={gifSettings.pingPong}
                            currentFrame={this.props.currentFrame}
                            startFrame={startFrame}
                            speed={gifSettings.speed || 10}
                            loop={gifSettings.loop}
                            src={url}
                            width={imageStyle.width}
                            height={imageStyle.height}/>
                        :
                        <img
                            onLoad={this.mediaLoaded.bind(this, media.id)}
                            src={url}
                            width={imageStyle.width}
                            height={imageStyle.height} />
                }
            </div>
        )
    }
}

PreviewMedia.propTypes = {}

export default PreviewMedia
