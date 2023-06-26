import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Dialog, ButtonGroup, MenuItem, Intent, Button, Classes} from "@blueprintjs/core"
import {Select} from "@blueprintjs/select"
import {filterGeneric, renderGeneric, filterEpisode, renderEpisode} from "./controls/custom-select.js"
import CustomIcons from "./custom-icons"
import {saveClip} from "../clip/actions/clip-actions"
import axios from "axios/index"
import Loading from "../clip/components/shared/loading.js"


class NewClipOverlay extends Component {

    constructor() {
        super()

        this.state = {
            feeds: [],
            episodes: [],
            selectedFeed: null,
            selectedEpisode: null
        }
    }

    componentDidMount() {
        this.refreshFeedList()
    }

    refreshFeedList(){

    }

    handleClose(){
        this.props.onClose()
    }

    handleFeedSelect(feed) {
        this.props.loadFeedDetail(feed.id)
        this.setState({selectedFeed: feed})
    }

    handleEpisodeSelect(episode) {
        this.setState({selectedEpisode: episode})
    }

    openClipCutter() {
        const {selectedFeed, selectedEpisode} = this.state
        this.props.history.push(`/library/feed/${selectedFeed.id}/${selectedEpisode.id}/newclip`)
    }

    onAudioClipUpload(event) {
        const {selectedFeed, selectedEpisode} = this.state

        this.setState({loading: true})

        const formData = new FormData()
        formData.append("imageData", event.target.files[0]);
        axios.post(`/admin/api/file/data_upload`, formData).
        then(res => {

            const clipObject = {
                title: res.data.fileName,
                start: 0,
                end: 0,
                totalDuration: 10,
                PodcastFeedId: selectedFeed.id,
                PodcastId: selectedEpisode?selectedEpisode.id:null,
                audioUrl: res.data.file
            }

            axios.post(`/admin/api/clip`, {
                clip: clipObject
            }).
            then(res => this.props.clipCreated(res.data.id)).
            catch(e => console.error(e))

        })
    }

    render() {

        const {selectedFeed, selectedEpisode, loading} = this.state
        const {feeds, feedsById} = this.props
        const episodes = selectedFeed?feedsById[selectedFeed.id].Podcasts:[]

        {/*icon='film'*/}
        {/*title="New clip"*/}
        {/*autoFocus={false}*/}
        {/*enforceFocus={false}*/}
        {/*canOutsideClickClose={false}*/}
        {/*onClose={this.handleClose.bind(this)}*/}
        {/*{...this.props}>*/}

        return (
            <div className='new-clip-overlay'>

                <Loading show={loading} />

                <Select
                    className='bp3-large select-control'
                    noResults={<MenuItem disabled={true} text="No results." />}
                    items={feeds}
                    itemPredicate={filterGeneric}
                    itemRenderer={renderGeneric}
                    onItemSelect={this.handleFeedSelect.bind(this)}>

                    <Button
                        className='bp3-fill'
                        icon={CustomIcons.podcastIcon}
                        rightIcon="double-caret-vertical"
                        text={selectedFeed ? selectedFeed.name : 'Select a podcast'}
                    />
                </Select>

                <Select
                    className='bp3-large select-control'
                    noResults={<MenuItem disabled={true} text="No results." />}
                    items={episodes}
                    itemPredicate={filterEpisode}
                    itemRenderer={renderEpisode}
                    onItemSelect={this.handleEpisodeSelect.bind(this)}>

                    <Button
                        className='bp3-fill bp3-text-overflow-ellipsis'
                        disabled={!selectedFeed}
                        icon={CustomIcons.episodeIcon}
                        rightIcon="double-caret-vertical"
                        text={selectedEpisode ? selectedEpisode.title : 'Select an episode'}
                    />
                </Select>

                <ButtonGroup className='bp3-fill bp3-large'>
                    <Button onClick={this.openClipCutter.bind(this)} disabled={!selectedEpisode} icon='cut' intent={Intent.PRIMARY} >
                        Cut Clip
                    </Button>
                    <label className={'bp3-button bp3-icon-upload bp3-fill bp3-large ' + (selectedFeed?'':'bp3-disabled') }>
                        Upload File
                        <input disabled={!selectedFeed} onChange={this.onAudioClipUpload.bind(this)} type="file" hidden />
                    </label>
                </ButtonGroup>

            </div>
        )
    }
}

NewClipOverlay.propTypes = {}

export default NewClipOverlay
