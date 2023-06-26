import React, {Component} from 'react'
import axios from 'axios'
import {Prompt} from 'react-router'
import PropTypes from 'prop-types'
import AudioRecorder from './shared/recorder'
import ReactPlayer from 'react-player'
import ClipCutter from './clip-editor/clip-cutter'
import FileDrop from 'react-file-drop'
import VisPreview from './template/vis-preview.jsx'
import NiceButton from '../components/shared/nice-button'
import CustomIcons from "../../shared/custom-icons"
import {filterEpisode, filterGeneric, renderEpisode, renderGeneric} from "../../shared/controls/custom-select"
import {
    Button,
    Classes,
    Alert,
    FormGroup,
    Spinner,
    InputGroup,
    ControlGroup,
    Intent,
    Card,
    Popover,
    Tabs, Tab,
    MenuItem,
    Switch,
    Position,
    ButtonGroup, H4, H5, H2, H3, NumericInput
} from "@blueprintjs/core"
import {Select} from "@blueprintjs/select"

const AUDIO_SOURCES = {
    FILE: 'file',
    CLIP: 'clip',
    MIC: 'mic'
}

function pathInfo(s) {
    s=s.match(/(.*?\/)?(([^/]*?)(\.[^/.]+?)?)(?:[?#].*)?$/);
    return {path:s[1],file:s[2],name:s[3],ext:s[4]};
}

let reqInstance = axios.create({
    headers: {
        'Content-Type': 'application/octet-stream'
    }
})


const AudioContext = window.AudioContext || window.webkitAudioContext

import LANGUAGES from '../languages'

class WizardImport extends Component {

    state = {
        show: null,
        selectedFile: null,
        audioSource: AUDIO_SOURCES.FILE,
        recording: false,
        playing: false,
        isOpen: false,
        message: 'Hey, you can edit this clip!',
        invitees: [],
        addFriend: true,
        canRecord: false,
        templates: [],
        copyTemplate: false,
        shows:[],
        selectedStep: 'step1',
        multipleSpeakers: false,
        error: null,
        selectedLocale: {id: 'en-US', name: 'English (US)'},
        getTranscript: false,
        showTrim: false,
        isManualTranscript: false,
        isMusic: false,
        transcript: false
    }

    constructor(props) {
        super(props)
        this.myRef = React.createRef();
    }

    setAudioSource(audioSource) {
        this.setState({
            audioSource,
            selectedFile: null
        })
    }

    onDrop(files) {
        const selectedFile = files[0]
        this.selectFile(selectedFile)
    }

    selectFile = async (selectedFile) => {
        const extension = pathInfo(selectedFile.name).ext
        const size = selectedFile.size

        if (!['.mp3', '.wav', '.MP3', '.WAV', '.aac'].includes(extension)) {
            return this.setState({
                error: 'Invalid Extension'
            })
        }

        if (size > 120000000) {
            return this.setState({
                error: 'File Too Large (80MB Max)'
            })
        }

        this.setState({
            selectedFile,
            audioUrl: URL.createObjectURL(selectedFile)
        })

    }

    onFileSelected(event) {
        const selectedFile = event.target.files[0]
        this.selectFile(selectedFile)
    }

    uploadFile = async () => {
        const {feedId, selectedFile, multipleSpeakers, clipCut, selectedLocale, getTranscript, transcript, isMusic, uploadUrl} = this.state

        this.props.setMessage('Uploading Clip')

        const fileName = selectedFile.name

        const createUrlRes = await axios.post('/admin/api/clip/create_upload_url', {
            fileName
        })

        const {url, mimeType} = createUrlRes.data

        try {

            await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': mimeType
                },
                body: selectedFile,
            })

            const parsedUrl = new URL(url)
            const audioUrl = `${parsedUrl.origin}${parsedUrl.pathname}`

            const res = await axios.post(`/admin/api/clip/upload`, {
                audioUrl,
                getTranscript,
                isMusic,
                showId: feedId? feedId:-1,
                multipleSpeakers,
                languageCode: selectedLocale.id,
                clipCut,
                transcript,
                fileName
            })

            this.props.history.push('/library/wizard/' + res.data.id)
        }
        catch (e) {
            this.setState({
                error: e
            })

            this.props.setMessage(null)
        }
    }

    cutClip = () => {
        const {clipCut, episodeId, selectedFeed, multipleSpeakers, selectedLocale, getTranscript} = this.state

        this.props.setMessage('Cutting Clip')

        let data = {
            clip: {
                ...clipCut,
                PodcastId: episodeId,
                PodcastFeedId: selectedFeed.id
            },
            languageCode: selectedLocale.id,
            getTranscript
        }

        if (multipleSpeakers) {
            data.multipleSpeakers = 2
        }

        axios.post('/admin/api/clip/cut', data).
        then(res => {
            //this.props.onCut(res.data)
            this.props.history.push('/library/wizard/' + res.data.id)
        }).
        catch(res => {
            this.setState({
                error: res.response.data
            })

            this.props.setMessage(null)
        })
    }


    importAudio = () => {
        const {audioSource} = this.state
        switch (audioSource) {

            case AUDIO_SOURCES.MIC: return this.uploadFile()

            case AUDIO_SOURCES.FILE: return this.uploadFile()

            case AUDIO_SOURCES.CLIP: return this.cutClip()
        }
    }

    removeFile() {
        this.setState({
            selectedFile: null,
            audioUrl: null
        })
    }

    showChange = (show) => {

        // const clip = Object.assign({}, this.state.clip, {
        //     PodcastFeedId: show.id
        // })
        const selectedFeed = show

        if (show.jsonUrl) {
            axios.get(show.jsonUrl).then(res => {
                const jsonFeed = res.data
                this.setState({jsonFeed})
            })
        }

        this.setState({selectedFeed})
    }

    episodeChange = (selectedEpisode) => {

        const {selectedFeed} = this.state
        // const clip = Object.assign({}, this.state.clip, {
        //     PodcastFeedId: show.id
        // })

        this.setState({
            selectedEpisode,
            inlineMessage: 'Loading Episode...',
            audioUrl: null,
            audioPeaks: null,
            episodeId: null
        })

        this.getEpisodeInfo(selectedFeed.id, selectedEpisode.guid)
    }

    getEpisodeInfo(feedId, guid) {
        axios.get(`/admin/api/episode/${feedId}?guid=${encodeURIComponent(guid)}`).
        then(res => {
            const {data} = res

            if (!data.url) {
                return this.getEpisodeAudioUrl(data.episode.id)
            }

            if (data.peaks) {
                axios.get(data.peaks).
                then(peakRes => {
                    this.setState({
                        episodeId: data.episode.id,
                        audioUrl: data.url,
                        audioPeaks: peakRes.data,
                        inlineMessage: ''
                    })
                })
            }
        })
    }

    getEpisodeAudioUrl(episodeId) {
        axios.post(`/admin/api/episode/${episodeId}`).
        then(res => {

            const {data} = res

            this.setState({
                episodeId: episodeId,
                audioUrl: data.url,
                inlineMessage: ''
            })

        })
    }



    toggleRecording = () => {

        const {recording} = this.state

        this.recorder = RecordRTC(this.stream, {
            type: 'audio',
            recorderType: RecordRTC.StereoAudioRecorder
        })

        this.recorder.startRecording()

        this.setState({recording: !recording})

    }

    getAudioSpectrum = () => {
        this.analyser.getByteFrequencyData(this.frequencyBuffer)
        document.dispatchEvent(new CustomEvent('fftDataUpdate', {detail: this.frequencyBuffer.slice(0, 256) }))

        window.requestAnimationFrame(this.getAudioSpectrum)
    }

    getMicAccess = () => {

        // //this.wavesurfer.microphone.start()
        navigator.mediaDevices.getUserMedia({
            audio: true
        }).
        then( stream => {

            this.stream = stream

            this.setState({
                allowMicAccess: true
            })

            const aCtx = new AudioContext()
            this.analyser = aCtx.createAnalyser()
            this.analyser.fftSize = 1024;
            const microphone = aCtx.createMediaStreamSource(stream)
            microphone.connect(this.analyser)

            this.frequencyBuffer = new Uint8Array(this.analyser.frequencyBinCount)

            this.getAudioSpectrum()

            this.toggleRecording()

        }).
        catch(err => console.error(err))
    }

    stopRecording = () => {
        this.recorder.stopRecording(() => {
            let blob = this.recorder.getBlob();

            this.setState({
                recording: false,
                selectedFile: blob,
                audioUrl: URL.createObjectURL(blob)
            })
        })
    }

    playRecording = () => {
        const {playRecording, playerRef} = this.state
        this.setState({playRecording: !playRecording})
        //playerRef.play()
    }

    setPlay(playing){
        this.setState({playing})
    }

    onRecordingReady = (data) => {
        this.setState({
            selectedFile: data,
            recording: false
        })
    }


    onError = error => {
        this.setState({error: error.message})
    }

    setMusicFlag = e => {
        let {getTranscript} = this.state
        if (e.target.checked) {
            getTranscript = false
        }
        this.setState({
            isMusic: e.target.checked,
            getTranscript
        })
    }

    setManualTranscript = e => {
        let {isManualTranscript} = this.state
        this.setState({
            isManualTranscript: e.target.checked,
        })
    }

    onTranscriptChange = e => {
        this.setState({
            transcript: e.target.value
        })
    }

    render() {

        const {menuOpen, closeWizard, shows, userPlan} = this.props
        const {allowMicAccess,
            audioSource, selectedEpisode, episodeId,
            selectedFile, inlineMessage, audioUrl, audioPeaks, clipCut,
            getTranscript, clip, recording, selectedFeed, transcript,
            error, fonts, isMusic, selectedLocale, playRecording, isManualTranscript, errorMessage, jsonFeed} = this.state


        const show = selectedFeed


        let episodes = []
        if (show && jsonFeed) {
            episodes = jsonFeed.items
        }


        const disabled = () => {

            switch (audioSource) {

                case AUDIO_SOURCES.MIC: return !selectedFile

                case AUDIO_SOURCES.FILE: return !clipCut || !selectedFile

                case AUDIO_SOURCES.CLIP: return !clipCut
            }

        }

        let maxLength = 60

        if (userPlan) {
            const remainingTime = userPlan.currentPlan.maxSecondsImport - userPlan.audioImported
            const maxClipTime = userPlan.currentPlan.maxSecondsClipDuration

            maxLength = Math.min(remainingTime, maxClipTime)
        }

        const isFile = AUDIO_SOURCES.FILE !== audioSource
        const isMic = AUDIO_SOURCES.MIC !== audioSource
        const isClip = AUDIO_SOURCES.CLIP !== audioSource

        const containerWidth = this.myRef.current ? this.myRef.current.clientWidth - 60 : 0;

        const visArea = {
            animateColor: true,
            bar: {},
            colorVariation: {h: 0, l: 0, s: 0},
            gap: 1,
            hAlign: "center",
            hslColor: {h: 211, l: 50, s: 100},
            opacity: 1,
            sampleSize: 64,
            borderRadius: 2,
            type: "bar",
            vAlign: "center",
            top:50,
            left:0,
            height:100,
            width: containerWidth
        }

        return (
            <div ref={this.myRef} className='clip-wizard-import' style={{display: this.props.hide?'none':'block'}}>

                <Alert isOpen={error}  onClose={_ => this.setState({error: null})} > {error}</Alert>


                {
                    errorMessage && <div className="notification is-warning" dangerouslySetInnerHTML={{__html: errorMessage}} />
                }

                <div className="buttons has-addons is-centered">
                    <NiceButton
                        minimal={isFile}
                        intent={isFile?null:'link'}
                        active={isFile}
                        onClick={this.setAudioSource.bind(this, AUDIO_SOURCES.FILE)}
                        text='Upload a File'
                        icon='upload'
                    />
                    <NiceButton
                        minimal={isMic}
                        intent={isMic?null:'link'}
                        active={isMic}
                        onClick={this.setAudioSource.bind(this, AUDIO_SOURCES.MIC)}
                        text='Record yourself'
                        icon='microphone'
                    />
                    {/*<NiceButton*/}
                        {/*minimal={isClip}*/}
                        {/*intent={isClip?null:'link'}*/}
                        {/*active={isClip}*/}
                        {/*onClick={this.setAudioSource.bind(this, AUDIO_SOURCES.CLIP)}*/}
                        {/*text='Cut a Clip'*/}
                        {/*icon='cut'*/}
                    {/*/>*/}
                </div>

                <Card elevation={0} className='bp3-text-large margin-top-20'>

                    {
                        AUDIO_SOURCES.FILE === audioSource &&
                        <FileDrop onDrop={this.onDrop.bind(this)} className='file-drop-container'>
                            <FormGroup
                                label={'Browse an audio file or drop one here'}
                                labelInfo="(max 20MB, mp3 or wav)">

                                {
                                    !selectedFile &&
                                    <label className="bu-button bu-is-medium bu-is-primary margin-top">
                                        Select File
                                        <input
                                            type="file"
                                            hidden
                                            accept=".mp3,.wav,.flac, .aac"
                                            onChange={this.onFileSelected.bind(this)}
                                        />
                                    </label>
                                }

                                {
                                    selectedFile &&
                                    <ControlGroup vertical={false} className={'upload-input'}>
                                        <InputGroup value={selectedFile.name} disabled={true} />
                                        <Button minimal={true} icon={'trash'} onClick={this.removeFile.bind(this)} />
                                    </ControlGroup>
                                }
                            </FormGroup>



                            {
                                audioUrl && selectedFile &&  <ClipCutter
                                    showForm={true}
                                    fillParent={true}
                                    key={'upload'}
                                    audioUrl={audioUrl}
                                    length={selectedFile.size}
                                    maxLength={maxLength}
                                    audioPeaks={null}
                                    onClipChange={clipCut => this.setState({clipCut})}
                                />
                            }

                        </FileDrop>
                    }


                    {
                        AUDIO_SOURCES.CLIP === audioSource &&
                        <div className='margin-bottom full-width'>
                            <FormGroup >
                                <Select
                                    popoverProps={{
                                        position: Position.BOTTOM_LEFT,
                                        targetTagName: 'div'
                                    }}
                                    noResults={<MenuItem disabled={true} text="No results." />}
                                    items={shows || []}
                                    activeItem={show}
                                    itemPredicate={filterGeneric}
                                    itemRenderer={renderGeneric}
                                    onItemSelect={this.showChange}>

                                    <Button
                                        className={'template-list'}
                                        large={true}
                                        icon={CustomIcons.podcastIcon}
                                        rightIcon={'caret-down'}>
                                        {show ? show.name : 'Pick a show from the list'}
                                    </Button>
                                </Select>
                            </FormGroup>

                            <FormGroup >
                                <Select
                                    popoverProps={{
                                        position: Position.BOTTOM,
                                        targetTagName: 'div'
                                    }}
                                    noResults={<MenuItem disabled={true} text="No results." />}
                                    items={episodes}
                                    activeItem={selectedEpisode}
                                    itemPredicate={filterEpisode}
                                    itemRenderer={renderEpisode}
                                    onItemSelect={this.episodeChange}>

                                    <Button
                                        large={true}
                                        disabled={!episodes.length}
                                        icon={CustomIcons.episodeIcon}
                                        className={'template-list'}
                                        rightIcon={'caret-down'}>
                                        {selectedEpisode? selectedEpisode.title : 'Pick an episode from the list'}
                                    </Button>
                                </Select>
                            </FormGroup>

                            {
                                episodeId && audioUrl &&
                                <ClipCutter
                                    showForm={true}
                                    key={episodeId}
                                    episodeId={episodeId}
                                    audioUrl={audioUrl}
                                    audioPeaks={audioPeaks}
                                    onClipChange={clipCut => this.setState({clipCut})}
                                    maxLength={5 * 60}
                                />
                            }


                            {
                                episodeId && !audioUrl &&
                                <div>
                                    <Spinner intent={Intent.PRIMARY} size={30} />
                                    <div className='loading-message'>Loading Episode... (this may take up to 30 seconds)</div>
                                </div>
                            }
                        </div>
                    }

                    {
                        AUDIO_SOURCES.MIC === audioSource &&
                        <div className='step-record'>

                            {/*<AudioRecorder*/}
                                {/*playing={playRecording}*/}
                                {/*recording={recording}*/}
                                {/*onRecordPress={_ => this.setState({recording: true})}*/}
                                {/*onReady={playerRef => this.setState({canRecord: true, playerRef})}*/}
                                {/*onRecordingReady={this.onRecordingReady}*/}
                                {/*onError={this.onError}*/}
                            {/*/>*/}

                            {/*{*/}
                                {/*!canRecord &&*/}
                                {/*<div className="notification is-warning">*/}
                                    {/*Click on the microphone to allow access*/}
                                {/*</div>*/}
                            {/*}*/}


                            <div style={{position:'relative', margin:'auto', height: '200px', width: visArea.width + 'px'}}>
                                <VisPreview
                                    id='mic-preview'
                                    viewMode={true}
                                    noStartData={true}
                                    visArea={visArea}
                                    originalElement={visArea}>
                                </VisPreview>
                            </div>


                            <div className="buttons has-addons is-centered margin-bottom">


                                {
                                    allowMicAccess && <div>
                                        {
                                            recording?
                                                <NiceButton
                                                    large={true}
                                                    icon='stop'
                                                    intent={Intent.DANGER}
                                                    text='Stop'
                                                    onClick={this.stopRecording}
                                                />:
                                                <NiceButton
                                                    large={true}
                                                    icon='microphone'
                                                    intent={Intent.DANGER}
                                                    text='Record'
                                                    onClick={this.toggleRecording}
                                                />
                                        }
                                    </div>
                                }

                                {
                                    !allowMicAccess && <div>
                                        <NiceButton
                                            large={true}
                                            icon='microphone'
                                            selected={true}
                                            intent={Intent.DANGER}
                                            text='Record'
                                            onClick={this.getMicAccess}
                                        />
                                    </div>
                                }

                                {/*<NiceButton*/}
                                    {/*icon='play'*/}
                                    {/*disabled={!selectedFile}*/}
                                    {/*large={true}*/}
                                    {/*intent={Intent.PRIMARY}*/}
                                    {/*text='Play'*/}
                                    {/*onClick={this.playRecording}*/}
                                {/*/>*/}



                            </div>


                            {
                                audioUrl && selectedFile &&  <ClipCutter
                                    showForm={true}
                                    key={'upload'}
                                    audioUrl={audioUrl}
                                    length={selectedFile.size}
                                    maxLength={maxLength}
                                    audioPeaks={null}
                                    minimumPxPerSec={20}
                                    fillParent={true}
                                    onClipChange={clipCut => this.setState({clipCut})}
                                />
                            }

                            {/*<Wavesurfer*/}
                            {/*ref={this.waveSurferRef.bind(this)}*/}
                            {/*options={waveOptions}*/}
                            {/*onReady={this.handleReady.bind(this)}*/}
                            {/*playing={this.state.playing}*/}
                            {/*onPosChange={this.posChange.bind(this)}*/}
                            {/*microphone={true}*/}
                            {/*/>*/}


                        </div>
                    }

                    {
                        (!!selectedFile || AUDIO_SOURCES.CLIP === audioSource && clipCut) &&
                        <div className={'import-controls text-align-left'}>

                            <div className='bu-columns'>

                                <div className='bu-column bu-is-one-third'>
                                    <Switch checked={isMusic}
                                            large={true}
                                            label="This is a Music Clip"
                                            onChange={this.setMusicFlag} />
                                </div>

                            </div>

                            <div className='bu-columns'>
                                <div className='bu-column bu-is-half'>
                                    <Switch
                                        large={true}
                                        disabled={isMusic}
                                        checked={getTranscript}
                                        label="Auto-Transcribe this content"
                                        onChange={e => this.setState({getTranscript: e.target.checked})} />
                                </div>


                                {
                                    getTranscript && <React.Fragment>
                                        <div className='bu-column bu-is-half'>
                                            <FormGroup inline={true} label='Language'>
                                                <Select
                                                    noResults={<MenuItem disabled={true} text="No results." />}
                                                    items={LANGUAGES || []}
                                                    activeItem={selectedLocale}
                                                    itemPredicate={filterGeneric}
                                                    itemRenderer={renderGeneric}
                                                    onItemSelect={selectedLocale => this.setState({selectedLocale})}>

                                                    <Button
                                                        text={selectedLocale.name}
                                                        className={'template-list'}
                                                        large={true}
                                                        rightIcon={'caret-down'} />

                                                </Select>
                                            </FormGroup>
                                        </div>
                                        {/*<div className='column'>*/}
                                        {/*<Switch disabled={selectedLocale.id !== 'en-US'} checked={this.state.multipleSpeakers} label="Detect Speakers"*/}
                                        {/*onChange={e => this.setState({multipleSpeakers: e.target.checked})} />*/}
                                        {/*</div>*/}
                                    </React.Fragment>
                                }
                            </div>

                            <div className='bu-columns'>

                                <div className='bu-column bu-is-half'>
                                    <Switch checked={isManualTranscript}
                                            large={true}
                                            label="I have the transcript/lyrics"
                                            onChange={this.setManualTranscript} />
                                </div>

                            </div>

                            {
                                isManualTranscript && <div>
                                    <textarea className="bu-textarea padding"
                                              placeholder="Copy/Paste Here"
                                              onChange={this.onTranscriptChange}
                                              value={transcript}
                                              rows={15}
                                    />
                                </div>
                            }
                        </div>
                    }

                    {
                        inlineMessage &&
                        <div>
                            <Spinner intent={Intent.PRIMARY} size={30} />
                            <div className='loading-message'>{inlineMessage}</div>
                        </div>
                    }


                </Card>

                <nav className="bu-navbar" role="navigation" aria-label="main navigation">
                    <div className="bu-navbar-menu">
                        <div className='bu-navbar-item margin-auto'>

                            <NiceButton
                                className='margin-right'
                                text='Close'
                                minimal={true}
                                large={true}
                                onClick={closeWizard}
                            />

                            <NiceButton
                                disabled={disabled()}
                                intent={Intent.PRIMARY}
                                text='Import Audio'
                                icon={'file-import'}
                                large={true}
                                onClick={this.importAudio}
                            />
                        </div>
                    </div>
                </nav>





            </div>
        )
    }
}

WizardImport.propTypes = {}

export default WizardImport
