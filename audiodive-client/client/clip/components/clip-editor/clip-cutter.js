import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Wavesurfer from '../vendor/wavesurfer-react.js'
import TimeInput from '../../../shared/controls/time-input.jsx'
import Loading from '../shared/loading.js'
import axios from "axios/index"
import update from 'immutability-helper'
import UI_TEXT from '../../ui-text'
import {Switch} from '@blueprintjs/core/'

import './clip-cutter.scss'

import {
    Icon, Intent,
    AnchorButton,
    Button,
    ButtonGroup,
    Popover,
    Tag,
    FormGroup,
    InputGroup,
    ControlGroup,
    Tooltip
} from "@blueprintjs/core"
import throttle from "lodash/throttle"
import NiceButton from "../shared/nice-button"
import {Position} from "@blueprintjs/core/lib/esm/index"

class ClipCutter extends Component {

    constructor() {
        super()
        this.state = {
            ready: false,
            saving: true,
            playing: false,
            regionPlaying: false,
            activeRegion: null,
            clips: [],
            audioUrl: null,
            audioPeaks: null,
            backend: 'MediaElement',
            currentPos: '',
            length: 60,
            pos: 5,
            insertClip: false,
            regions: {
                'clip': {
                    id: 'clip',
                    name: 'new clip',
                    start: 1,
                    end: 20,
                    fadeDuration: 1
                }
            },
            showTrim: false
        }
    }

    componentDidMount() {
        //this.onClipChange('PodcastId', this.props.episode.id)
        //this.checkAudioSourceUrl()
        this.throttleProgressChange = throttle(this.updateDisplayTime, 50)
    }

    checkAudioSourceUrl() {
        axios.post(`/admin/api/clip/check`, {
            podcastId: this.props.episode.id
        }).
        then(res => {
            this.initAudioParams(res.data)
        })
    }

    initAudioParams(data){
        if (data.peaks) {
            axios.get(data.peaks).
            then(peakRes => {
                this.setState({
                    audioUrl: data.url,
                    audioPeaks: peakRes.data
                })
            })
        }
        else {
            this.setState({
                audioUrl: data.url
            })
        }
    }

    savePeaks() {

        const nominalWidth = Math.round(this.wavesurfer.getDuration() * 3)

        let formData = new FormData()
        const data = JSON.stringify(this.wavesurfer.backend.getPeaks(nominalWidth,0,nominalWidth))
        const blob = new Blob([data], {type: "application/json"})

        formData.append('peaks', blob, 'peaks.json')

        axios.post(`/admin/api/episode/peaks/${this.props.episodeId}`, formData).
        then(res => {

        })
    }

    saveClip() {

        // axios.post('/admin/api/clip', {
        //     clip: {
        //         ...this.state.regions.clip,
        //         PodcastId: this.props.episode.id,
        //         PodcastFeedId: this.props.episode.PodcastFeedId,
        //         CreatorId: this.props.episode.CreatorId
        //     }
        // }).
        // then(res => {
        //     this.props.onCut(res.data)
        // })
    }

    discard() {
        this.props.onDiscard && this.props.onDiscard()
    }

    parseSeconds(seconds) {
        const sec_num = parseFloat(seconds, 10); // don't forget the second param
        const hours   = Math.floor(sec_num / 3600);
        const minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        seconds = sec_num - (hours * 3600) - (minutes * 60);

        return {hours, minutes, seconds}
    }

    waveformReady(e) {
        if (!this.props.audioPeaks && this.props.episodeId) {
            this.savePeaks()
        }
    }

    handleReady(e) {
        this.wavesurfer = e.wavesurfer

        const duration =  this.wavesurfer.getDuration()

        const regions = {
            'clip': {
                id: 'clip',
                name: 'new clip',
                start: 0,
                end: this.wavesurfer.getDuration(),
                fadeDuration: 1
            }
        }

        this.setState({
            regions,
            duration
        }, this.clipChange)

        //this.onTimeChange(5)
    }

    handleSingleRegionClick() {

    }

    handleRegionUpdate(list, e) {


        const selectedRegion = e.region

        const start = selectedRegion.start < 0? 0:selectedRegion.start

        const newState = update(this.state, {
            regions: {
                clip: {
                    start: {$set: start},
                    end: {$set: selectedRegion.end}
                }
            }})

        this.setState(newState, this.clipChange)
    }

    isValid() {
        const {maxLength} = this.props
        const {clip} = this.state.regions

        let currentLength = clip.end - clip.start

        return true
       // return currentLength > 0 && currentLength < maxLength
    }

    clipChange = () => {
        const {onClipChange, maxLength} = this.props
        const {clip} = this.state.regions
        let validClip = null

        if (this.isValid()) {
            validClip = clip
        }

        onClipChange && onClipChange(validClip)
    }

    updateDisplayTime(currentTime) {

        const cleanTime = parseFloat(currentTime.toFixed(2))

        this.setState({
            pos: cleanTime
        })
    }

    posChange(currentTime){
        this.throttleProgressChange(currentTime)
    }

    togglePlay() {

        this.setState({
            playing: !this.state.playing
        })
    }

    onTimeChange(value) {
        this.setState({
            pos: value
        })
        this.wavesurfer.setCurrentTime(value)
    }

    onClipChange(key, value) {

        if (key === 'start' && value < 0) {
            value = 0
        }

        const newState = update(this.state, {
            regions: {clip: {[key]: {$set: value}}}
        })

        this.setState(newState, this.clipChange)
    }

    componentDidUpdate() {

    }

    setFromCurrentTime(key) {
        this.onClipChange(key, this.state.pos)
    }


    step(dir){
        const clip = this.state.regions.clip
        const pos = this.state.pos

        const steps = [0, clip.start, clip.end, Math.ceil(this.wavesurfer.getDuration())]
        let index = 0
        for (index; index < 3; index++) {
            const current = steps[index]
            const next = steps[index+1]

            if (pos >= current && pos < next) {
                break
            }
        }

        index += dir

        this.wavesurfer.setCurrentTime(Math.max(steps[index], 0))
    }

    toggleTrim = () => {
        this.setState({showTrim: !this.state.showTrim})
    }

    render() {

        const {showForm, length, maxLength, minimumPxPerSec, fillParent} = this.props

        const {regions, pos, duration, showTrim} = this.state

        let minPxPerSec = minimumPxPerSec || 3

        // if (length && length < 2000000) {
        //     minPxPerSec = 40
        // }

        const timelineOptions = {
            timeInterval: 15,
            height: 10,
            primaryFontColor: '#777',
            secondaryFontColor: '#777',
            primaryColor: 'rgba(16, 22, 26, 0.3)',
            secondaryColor: 'rgba(16, 22, 26, 0.3)',
            fontFamily: '"Lucida Console", Monaco, monospace',
            notchPercentHeight: 40,
            fontSize: 9,
            labelPadding: 3,
            formatTimeCallback: s => {
                const {hours, minutes, seconds} = this.parseSeconds(s);
                return (hours? `${hours}h`:'') + (minutes? `${minutes}m`:'') + (seconds?`${seconds}s`:'');
            }
        }

        const waveOptions = {
            fillParent: !!fillParent,
            hasProgressCanvas: true,
            height: 80,
            progressColor: '#5c7080',
            waveColor: '#8A9BA8',
            normalize: true,
            audioRate: this.state.audioRate,
            cursorColor: '#738694',
            cursorWidth: 1,
            interact: true,
            pixelRatio: 1,
            minPxPerSec,
            //partialRender: true,
            autoCenter: false,
            backend: this.state.backend
        }


        // const waveOptions = {
        //     fillParent: false,
        //     height: 60,
        //     progressColor: '#5c7080',
        //     waveColor: '#8A9BA8',
        //     normalize: true,
        //     audioRate: this.state.audioRate,
        //     cursorColor: '#666',
        //     cursorWidth: 1,
        //     interact: true,
        //     minPxPerSec:200,
        //     pixelRatio: 1,
        //     autoCenter: false
        // }


        const clip = regions.clip
        const clipTime = clip.end - clip.start + (clip.fadeDuration * 2)

        let error = ''
        if (clipTime > maxLength) {
            error = `Current clip is too long (<strong>${Math.round(clipTime/60)}mn</strong>). The maximum duration allowed for your plan is <strong>${Math.round(maxLength/60)}mn</strong>`
        }

        return (
            <div className="clip-cutter">

                {
                    regions &&
                    <Wavesurfer
                        className='wavesurfer-container'
                        options={waveOptions}
                        timelineOptions={timelineOptions}
                        src={this.props.audioUrl}
                        waveformReady={this.waveformReady.bind(this)}
                        onReady={this.handleReady.bind(this)}
                        playing={this.state.playing}
                        regionPlaying={this.state.regionPlaying}
                        onPosChange={this.posChange.bind(this)}
                        regions={showTrim && regions}
                        onRegionClick={this.handleSingleRegionClick.bind(this)}
                        onRegionUpdateEnd={this.handleRegionUpdate.bind(this)}
                        selectedRegionId={this.state.activeRegion && this.state.activeRegion.id}
                        showCursor={true}
                        audioPeaks={this.props.audioPeaks}
                        renderCustomCursor={showTrim && <ButtonGroup
                            className={'with-arrow'}>
                            <Tooltip content={UI_TEXT.SET_START}>
                                <AnchorButton
                                    small={true}
                                    //disabled={pos > regions.clip.end}
                                    intent={Intent.PRIMARY}
                                    className={'button-set-start'}
                                    rightIcon="log-in"
                                    onClick={this.setFromCurrentTime.bind(this, 'start')}
                                />
                            </Tooltip>
                            <Tooltip content={UI_TEXT.SET_END}>
                                <AnchorButton
                                    small={true}
                                    disabled={pos < regions.clip.start}
                                    intent={Intent.WARNING}
                                    className={'button-set-end'}
                                    rightIcon="log-in"
                                    onClick={this.setFromCurrentTime.bind(this, 'end')}
                                />
                            </Tooltip>
                        </ButtonGroup>}
                    />
                }

                <div className='bu-columns clip-cutter-player margin-top-20 margin-bottom-20'>

                    <div className={'bu-column bu-is-one-third clip-cutter-column text-align-left'}>
                        <Switch large={true} label={'Trim Clip'} checked={showTrim} onChange={this.toggleTrim} />
                    </div>

                    <div className={'bu-column bu-is-one-third clip-cutter-column'} >

                        <div className='bu-buttons bu-is-centered '>

                            <NiceButton
                                minimal={true}
                                disabled={pos === 0}
                                icon='step-backward'
                                onClick={this.step.bind(this, -1)}
                            />

                            <NiceButton minimal={true} icon='fast-backward' onClick={() => this.wavesurfer.setCurrentTime(pos - 2)} />
                            {
                                this.state.playing ?
                                    <NiceButton minimal={true} className={'button-large-no-margin'} onClick={this.togglePlay.bind(this)} ><Icon icon="pause" iconSize={20} /></NiceButton> :
                                    <NiceButton minimal={true} className={'button-large-no-margin'} onClick={this.togglePlay.bind(this)} ><Icon icon="play" iconSize={20} /></NiceButton>
                            }
                            <NiceButton minimal={true} icon='fast-forward' onClick={() => this.wavesurfer.setCurrentTime(pos + 2)} />
                            <NiceButton
                                minimal={true}
                                icon='step-forward'
                                onClick={this.step.bind(this, 1)}
                            />
                        </div>

                    </div>


                    <div className={'bu-column bu-is-one-third clip-cutter-column'}>
                        <TimeInput
                            onChange={this.onTimeChange.bind(this)}
                            value={pos}
                            leftIcon={'time'}
                            duration={duration}
                            rightElement={<span> / <Tag minimal={true}>{TimeInput.getPlaybackTime(duration)}</Tag></span>}
                        />

                        {/* todo: add time limit helper */}
                        {/*<Popover*/}
                            {/*position={Position.BOTTOM}*/}
                            {/*content={<Menu>*/}
                                {/*<MenuItem*/}
                                    {/*text={text}*/}
                                    {/*onClick={e => this.setLimit()}*/}
                                {/*/>*/}
                            {/*</Menu>}>*/}
                            {/*<NiceButton text={'Set limit...'}  />*/}
                        {/*</Popover>*/}
                    </div>



                </div>



                {
                    showForm && showTrim &&
                    <section className='margin-top-10 bu-columns'>
                        {/*<FormGroup*/}
                        {/*label="Clip Name"*/}
                        {/*for={'name'}*/}
                        {/*className={'margin-right'}*/}
                        {/*>*/}
                        {/*<input*/}
                        {/*required={true}*/}
                        {/*className={Classes.INPUT}*/}
                        {/*id="name"*/}
                        {/*placeholder="Clip Name"*/}
                        {/*value={regions.clip.name}*/}
                        {/*onChange={e => this.onClipChange('name', e.target.value)}*/}
                        {/*/>*/}
                        {/*</FormGroup>*/}



                        <FormGroup
                            label="Start"
                            for={'start'}
                            className={'bu-column'}
                        >
                            <TimeInput
                                onChange={value => this.onClipChange('start', value)}
                                intent={Intent.PRIMARY}
                                id="start"
                                className={'flip-icon '}
                                leftIcon={'log-in'}
                                placeholder="Start Time"
                                value={regions.clip.start}
                            />
                        </FormGroup>

                        <FormGroup
                            label="End"
                            for={'end'}
                            className={'bu-column'}
                        >
                            <TimeInput
                                onChange={value => this.onClipChange('end', value)}
                                intent={Intent.WARNING}
                                id="end"
                                leftIcon={'log-in'}
                                placeholder="End Time"
                                value={regions.clip.end}
                            />
                        </FormGroup>

                        <FormGroup
                            label="Fade in/out duration"
                            for={'fade'}
                            className={'bu-column'}
                        >
                            <InputGroup
                                id="fade"
                                leftIcon={'random'}
                                placeholder="time in seconds"
                                value={regions.clip.fadeDuration}
                                onChange={e => this.onClipChange('fadeDuration', e.target.value)}
                            />
                        </FormGroup>

                        <FormGroup
                            className={'bu-column'}
                            label="Estimated Clip Time">
                            <TimeInput
                                intent={Intent.SUCCESS}
                                placeholder="Clip Time"
                                value={clipTime}
                                readOnly={true}
                            />

                        </FormGroup>
                    </section>
                }

                {
                    error && <div className="notification is-warning" dangerouslySetInnerHTML={{__html: error}} />
                }

                {/*{*/}
                    {/*!error && regions && <div className='notification is-success'>Your clip is good to go!</div>*/}
                {/*}*/}

                {/*<ButtonGroup className='flex margin-top-20'>*/}
                    {/*<Button*/}
                        {/*onClick={this.discard.bind(this)}*/}
                        {/*className={'bp3-fill bp3-large'}*/}
                        {/*text={'Discard'}*/}
                    {/*/>*/}
                    {/*<Button*/}
                        {/*onClick={this.saveClip.bind(this)}*/}
                        {/*intent={Intent.PRIMARY}*/}
                        {/*className={'bp3-fill bp3-large'}*/}
                        {/*text={'Cut Clip'}*/}
                        {/*icon={'cut'}*/}
                    {/*/>*/}
                {/*</ButtonGroup>*/}


            </div>
        )
    }
}

ClipCutter.propTypes = {}

export default ClipCutter
