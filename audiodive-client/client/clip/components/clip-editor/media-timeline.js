import React, {Component} from 'react'
import PropTypes from 'prop-types'
import sortedIndexBy from "lodash/sortedIndexBy"
import {Classes, Intent, Button, Tag} from "@blueprintjs/core"
import Draggable from 'react-draggable';

class MediaTimeline extends Component {

    state = {medias: null}

    componentDidMount() {
        this.refreshMedias()
    }

    refreshMedias() {
        const {mediasById} = this.props

        if (mediasById) {
            let sortedMedias = []
            for (let mediaId in mediasById) {
                let media = mediasById[mediaId]
                const index = sortedIndexBy(sortedMedias, media, m => parseFloat(m.general.time))
                sortedMedias.splice(index, 0, media)
            }
            this.setState({medias: sortedMedias})
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.mediasById !== prevProps.mediasById) {
            this.refreshMedias()
        }
    }

    onStop = (d, mediaId) => {
        this.props.onMediaStartTimeChange(d, mediaId)
    }

    render() {

        const {totalDuration, onMediaSelected, selectedMediaId, onMediaDurationChange, pictureTime} = this.props
        const {medias, dragging} = this.state

        const Media = (media, index) => {

            const {time, duration, endtime, timing} = media.general

            const container = document.querySelector('wave')
            const mediaTime = parseFloat(time)
            const left = (mediaTime / totalDuration) * container.offsetWidth;

            const style = {
                left: `${left}px`,
                zIndex: -index
            }

            let computedDuration // = (timing == 'duration' ? media.general.duration : media.general);
            switch (timing) {
                case 'duration' :   computedDuration = duration; break
                case 'endtime' :    computedDuration = endtime - time; break
                case 'gif' :        computedDuration = duration; break
            }

            const durationView = duration / totalDuration * container.offsetWidth
            const isActive = selectedMediaId != null && selectedMediaId === media.id
            const mediaStyle = {width: durationView + 'px'}
            const className = isActive?'clip-editor-media active':'clip-editor-media'

            return ([
                <div
                    key={media.id}
                    className={className}
                    style={style}>

                    <Draggable
                        axis="x"
                        position={{ x: 0, y: 0 }}
                        onStop={(e, d) => {
                            if (d.x) {
                                this.onStop(d, media.id)
                            }
                            else {
                                onMediaSelected(media.id, media)
                            }
                        }}
                        grid={[1, 1]}>
                        <Tag
                            className='media-tag'
                            intent={Intent.WARNING}
                            interactive={true}
                            active={isActive}
                            //onClick={() => onMediaSelected(media.id, media)}
                        >
                            { media.name }
                        </Tag>
                    </Draggable>

                    {
                        true && //isActive &&
                        <div>
                            <span className="media-duration" style={mediaStyle} />
                            {
                                timing === 'duration' &&
                                <Draggable
                                    axis="x"
                                    handle=".handle"
                                    position={{ x: durationView, y: 0 }}
                                    onStop={(e, d, a) => {
                                        onMediaDurationChange(d, media.id)
                                        console.log(d,a)
                                    }}
                                    grid={[1, 1]}>
                                    <Button
                                        icon={'drag-handle-vertical'}
                                        className={`handle media-resize bp3-small`}>
                                    </Button>
                                </Draggable>
                            }
                        </div>
                    }
                </div>
            ])
        }

        const CoverPicture = props => {

            const container = document.querySelector('wave')
            const mediaTime = parseFloat(props.pictureTime)
            const left = (mediaTime / totalDuration) * container.offsetWidth;

            const style = {
                left: `${left}px`,
                zIndex: -100000,
                top:'34px',
                opacity:0.9,
                position: 'absolute'
            }

            return <div style={style}>
                <span className='bp3-tag'>Clip Thumbnail</span>
            </div>
        }

        return (
            <div className="clip-editor-media-container">
                {
                    medias && medias.map(Media)
                }

                {
                    pictureTime &&
                    <CoverPicture pictureTime={pictureTime} />
                }

                {
                    (selectedMediaId != null) &&
                    <div
                        onClick={e => this.setState({
                            selectedMediaId: null
                        })}
                        className="media-overlay"
                    />
                }
            </div>
        )
    }
}

MediaTimeline.propTypes = {}

export default MediaTimeline
