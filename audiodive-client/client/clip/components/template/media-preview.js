import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Utils} from "../../../shared/utils"
import Gif from '../../../vendor/gif/react-gif'
import RATIO from "../../../shared/video-ratio";
import ReactFabric from ".//react-fabric";

const BLANK_FABRIC_CONFIG = {
    version: "2.3.2",
    backgroundColor:'rgba(0,0,0,0)',
    objects: []
}

class MediaPreview extends Component {

    mediaLoaded(instance) {
    }

    onMediaSelected(objectId) {
        //this.props.setSelected(objectId)
    }

    componentDidUpdate(prevProps, prevState) {

        const {selectedMediaId} = this.props

        if (selectedMediaId !== prevProps.selectedMediaId) {
            this.resetMediaHelper(selectedMediaId)
        }
    }

    onMediaCanvasReady(canvas) {
        console.log('media canvas ready')
        this.mediaCanvas = canvas
        this.forceUpdate()

        const {selectedMediaId} = this.props
        if (selectedMediaId) {
            //this.props.setSelected(selectedMediaId)
            this.resetMediaHelper(selectedMediaId)
        }
    }

    onMediaCanvasDestroy() {
        console.log('media canvas destroy')
        this.mediaCanvas = null;
    }

    onMediaHelperUpdated() {
        const shallow = this.mediaCanvas.getObject('shallow')
        if (shallow) {
            this.props.onMediaChange(this.props.selectedMediaId, {
                imageStyle: {
                    left: shallow.left,
                    top: shallow.top,
                    width: Math.round(shallow.width * shallow.scaleX),
                    height: Math.round(shallow.height * shallow.scaleY)
                }
            })
        }
    }

    resetMediaHelper(mediaId){
        const {mediasById} = this.props

        if (this.mediaCanvas.getObject('shallow')) {
            this.mediaCanvas.deleteObject('shallow')
        }

        if (!mediaId) {
            return
        }

        const box = mediasById[mediaId].imageStyle

        const mediaHelper = this.mediaCanvas.addShallow({
            height: box.height,
            width: box.width,
            left: (box.left === undefined? box.x: box.left),
            top: (box.top === undefined? box.y: box.top)
        })

        this.props.onMediaCanvasReady(this.mediaCanvas)

        this.forceUpdate()

        return mediaHelper
    }


    render() {

        const {selectedMediaId, mediasById, currentFrame, activeRatio} = this.props
        const viewport = RATIO.DIMENSIONS[activeRatio]


        return <div>

            <ReactFabric
                key={activeRatio}
                width={viewport.width}
                height={viewport.height}
                readOnly={false}
                defaultData={BLANK_FABRIC_CONFIG}
                canvasId={'canvas_view'}
                onCanvasReady={this.onMediaCanvasReady.bind(this)}
                onFabricChange={this.onMediaHelperUpdated.bind(this)}
                onObjectSelected={this.onMediaSelected.bind(this)}
                onCanvasDestroyed={this.onMediaCanvasDestroy.bind(this)}
            />

        {
            mediasById && Object.entries(mediasById).map(([mediaId, media]) => {

                if (!media) {
                    //prob was deleted.
                    return (<div key={mediaId} />)
                }

                let styles = Utils.getStyles(media.imageStyle)
                if (media.general.zIndex) {
                    styles.zIndex = 20 + media.general.zIndex
                }

                const ext = media.url.split('.').pop()
                const isGif = ext === 'gif'
                const startTimeMs = parseFloat(media.general.time) * 1000;
                const startFrame = Utils.getFrameNumberFromTime(startTimeMs)
                const selected = selectedMediaId === mediaId


                return  <div
                    key={media.id}
                    id={'media_preview_'+ media.id}
                    style={styles}
                    onClick={e => this.props.setSelected(media.id)}
                    className={'layout-editor-dynamic-view-mode-image ' + (selected?'media-selected':'')}>
                    {
                        isGif?
                            <Gif
                                onLoad={this.mediaLoaded.bind(this)}
                                src={media.url}
                                pingPong={media.gifSettings.pingPong}
                                currentFrame={currentFrame}
                                startFrame={startFrame}
                                speed={media.gifSettings.speed || 10}
                                loop={media.gifSettings.loop}
                                width={media.imageStyle.width}
                                height={media.imageStyle.height}/>:
                            <img
                                src={media.url}
                                width={media.imageStyle.width}
                                height={media.imageStyle.height} />
                    }

                </div>
            })
        }
        </div>
    }
}

MediaPreview.propTypes = {}

export default MediaPreview
