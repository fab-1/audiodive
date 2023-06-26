import React from 'react';
import dayjs from 'dayjs';
import HasStorage from './shared/local-storage';
import TemplateEditor from './template/template-editor.jsx';
import ClipBlock from './clip-editor/clip-block';
import ClipTranscript from './clip-editor/clip-transcript';
import axios from 'axios';
import ResizableBar from './shared/resizable-bar'
import debounce from 'lodash/debounce';
import sortedIndexBy from "lodash/sortedIndexBy"
import withStorage from './shared/with-storage'
import TimeInput from '../../shared/controls/time-input.jsx'
import TimeAgo from 'react-timeago'
import Draggable from 'react-draggable';
import shortId from 'shortid'

import {
    Icon, Intent,
    H5,
    H6,
    Button,
    ButtonGroup,
    Popover,
    Classes,
    Position,
    ProgressBar,
    NavbarDivider,
    Spinner,
    NavbarGroup,
    MenuItem,
    Menu,
    Alert,
    TextArea,
    FormGroup,
    InputGroup,
    ControlGroup,
    Toaster,
    Tooltip,
    Hotkey, Hotkeys, HotkeysTarget,
    H3, H4,
    NumericInput,
    Tabs,
    Slider,
    Tab,
    Tag, Switch
} from "@blueprintjs/core";

import TextImporter from './clip-editor/text-importer'

import {QueryList, Select} from '@blueprintjs/select'
import AssetsManager from './assets-manager'

import Wavesurfer from './vendor/wavesurfer-react';

import { Prompt } from 'react-router';

import {connect} from 'react-redux'
import {
    fetchClip, saveClip, processClip, updateGlobal,
    updateWords, updateWord, createWord, splitWord, deleteWord,
    splitBlock, mergeBlock, updateBlock, shiftBlocks, canShiftWords, cloneBlock, deleteBlock,
    createMedia, updateMedia, deleteMedia, cloneMedia, updateClip, redoClip, undoClip, resetClip, importText, insertMode, addBlock
} from '../actions/clip-actions'

import {receiveTemplate, resetTemplate} from '../actions/template-actions'

import MediaPreview from './template/media-preview'

import throttle from "lodash/throttle"
import MediaTimeline from "./clip-editor/media-timeline"

import {filterAsset, filterGeneric, renderAsset, renderTemplate, renderTemplates} from "../../shared/controls/custom-select"

import CustomIcons from "../../shared/custom-icons"
import Loading from "./shared/loading"
import UI_TEXT from '../ui-text'
import {ActionCreators} from "redux-undo";
import {Utils as Util, Utils} from "../../shared/utils"
import RATIO from "../../shared/video-ratio"
import MediaControls from "./template/media-controls";
import Sidebar from "./shared/sidebar";
import Accordion from "./shared/accordion";
import {saveTemplate, undoTemplate, redoTemplate} from "../actions/template-actions"
import WebFont from "webfontloader"
import NiceButton from "./shared/nice-button"
import ShareClipForm from './shared/share-clip'
import StripeCheckout from "./stripe-checkout"


const mapStateToProps = state => {
    return {
        clipHistory: state.clip,
        templateHistory: state.template,
        clip: state.clip.present,
        template: state.template.present
    }
}

function unload(e) {
    const msg = "Are you sure you want to leave?"
    e.returnValue = msg
    return msg
}

const AppToaster = Toaster.create({
    className: "notifications",
    icon: 'film',
    position: Position.TOP_RIGHT
})



const SECTIONS = {
    CLIP: 'preview',
    TRANSCRIPT: 'transcript',
    TEMPLATE: 'template'
}

const viewPortScale = HasStorage? (localStorage.getItem('viewportScale') || 0.85):0.85

const DEFAULT_STATE = {
    loading:true,
    playing: false,
    pos: 0,
    currentBlock: '',
    audioRate: 1,
    activeTab: SECTIONS.CLIP,
    templatesById: null,
    newword: '',
    selectedMediaId: null,
    selectedBlockIndex: null,
    regionPlaying: false,
    viewportScale: Number(viewPortScale),
    activeRatio: RATIO.CONFIG_KEY.SQUARE,
    showDetails: false,
    showJobForm: false,
    jobRatio: RATIO.CONFIG_KEY.SQUARE,
    currentFrame: 0,
    selectedTemplateId: null
}


class ClipEditor extends React.Component {

    constructor(props) {
        super(props)

        this.state = this.state || DEFAULT_STATE

        this.oldData = []

        this.setBindings()
        this.throttleProgressChange = throttle(this.updateDisplayTime, 600)
        this.debounceSetActiveMedias = debounce(this.setActiveMedias, 200)

        this.templatesTimeline = gsap.timeline({
            paused:true
        })

        this.wordsTimeline = gsap.timeline({
            paused:true
        })
    }

    componentWillUnmount(){
        window.removeEventListener("beforeunload", unload)
        document.removeEventListener('keydown', this.setKeyboardEvents)

        if (this.currentTimeout) {
            window.clearTimeout(this.currentTimeout)
        }

        this.props.dispatch(resetClip())
        this.props.dispatch(resetTemplate())
    }

    componentDidMount() {

        document.addEventListener('keydown', this.setKeyboardEvents)

        if (location.href.indexOf('localhost') === -1) {
            window.addEventListener("beforeunload", unload)
        }

        this.debounceSave = _.debounce(this.saveForm, 1000)

        try {
            this.loadForm(this.props.id)
        }
        catch(e) {
            console.error(e)
        }
        this.props.closeMenu()
    }

    componentDidUpdate(prevProps, prevState) {

        const {selectedBlockIndex} = this.state

        const newSection = this.props.match.params.entityId
        if (newSection !== prevProps.match.params.entityId) {

            switch (newSection) {
                case 'clip':
                    this.setState({
                        selectedTemplateId: null
                    })

                    this.debounceUpdateTimeline()
                    break

                case 'template':
                    //this.templatesTimeline.clear()
                    break
            }
        }

        if (selectedBlockIndex !== prevState.selectedBlockIndex) {
            const {config} = this.props.clip
            const blockId = config.blockIds[selectedBlockIndex]
            const blockElement = document.getElementById(`tr-${blockId}`)
            const transcriptElement = document.getElementById('transcript-container')
            if (blockElement && transcriptElement) {
                const bound = blockElement.getBoundingClientRect()
                const top = bound.top + transcriptElement.scrollTop - 200

                transcriptElement.scrollTo({top, behavior: 'smooth'})
            }
        }
    }

    loadLayouts(feedId) {

        const {feedsById} = this.props
        const param = (feedId === null? '': '?feedId=' + feedId)
        this.templatesPromise = axios.get(`/admin/api/template/index${param}`)
        this.templatesPromise.then(res => {

            console.log(res.data)
            let templatesById = {}
            res.data.forEach(template => {
                const feed = feedsById[template.PodcastFeedId]
                template.label = feed? feed.name:''
                templatesById[template.id] = template
            })

            this.setState({
                templatesById
            })
        })
        return this.templatesPromise
    }

    jumpToBlock(blockIndex) {
        const block = this.props.clip.config.blocksById[this.props.clip.config.blockIds[blockIndex]];
        if (block) {
            const word = this.props.clip.config.wordsById[block.wordIds[0]];
            if (word) {
                this.updateTextForTime(word.start);
            }
        }
    }

    updateTextForTime(time = 0) {

        let word = null;
        for (let index = 0; index < this.props.clip.config.wordIds.length; index++) {
            word = this.props.clip.config.wordsById[this.props.clip.config.wordIds[index]];

            if (word.start <= time && time <= word.end) {
                break;
            }
        }

        this.setCurrentBlockFromWordId(word.id)
    }

    setCurrentBlockFromWordId(wordId) {

        const {wordsById, blockIds, blocksById} = this.props.clip.config

        const word = wordsById[wordId]
        const blockIndex = blockIds.indexOf(word.blockId)
        const block = blocksById[word.blockId]
        const selectedTemplateId = block.layout? block.layout:this.getTemplateId()

        this.setState({
            selectedBlockIndex: blockIndex,
            selectedTemplateId
        })

        this.debounceSetActiveMedias()
    }

    setActiveMedias() {
        const medias = [];
        const time = parseFloat(this.wavesurfer.getCurrentTime().toFixed(2))

        if (!this.props.clip.config) {
            return
        }

        for (let mediaId in this.props.clip.config.mediasById) {
            let media = this.props.clip.config.mediasById[mediaId]
            const startTime = parseFloat(media.general.time);
            const endTime = parseFloat(media.general.endtime);
            const duration = parseFloat(media.general.duration);

            const newTime = (media.general.timing === 'endtime' ? endTime : startTime + duration);

            if (startTime <= time && time <= newTime) {
                medias.push(media.id)
            }
        }

        this.setState({
            activeMediaIds: medias
        })
    }

    //Check if the template has the current ratio enabled
    isRatioAvailable(ratio){

        const {templatesById} = this.state

        if (!templatesById || !this.getTemplateId()) {
            return false
        }

        const mainLayout = templatesById[this.getTemplateId()]

        if (!mainLayout) {
            return false
        }

        return mainLayout[ratio] && mainLayout[ratio].canvas && mainLayout[ratio].canvas.objects.length > 1
    }

    detectRatio() {

        for (let i = 0; i < RATIO.ITEMS.length; i++) {
            const ratio = RATIO.ITEMS[i]

            if (this.isRatioAvailable(ratio)) {
                this.setState({activeRatio: ratio})
                return
            }
        }

    }

    getOpenedTemplateIds(clip) {
        let templateIds = [this.getTemplateId()]

        if (clip.config.blocksById) {
            Object.entries(clip.config.blocksById).forEach(entry => {
                const [blockId, block] = entry
                block.layout && !templateIds.includes(block.layout) && templateIds.push(block.layout)
            })
        }

        return templateIds
    }

    async loadForm(id) {

        const testMode = id == 1

        this.props.dispatch(ActionCreators.clearHistory())

        if (!id) {
            this.props.dispatch(resetClip())
            return
        }

        const res = await this.props.dispatch(fetchClip(id))

        const clip = res.clip


        const openedTemplateIds = this.getOpenedTemplateIds(clip)
        let selectedTemplateId = null

        if ((this.isTabActive(SECTIONS.TEMPLATE) || testMode) && this.props.match.params.extra) {
            selectedTemplateId = this.props.match.params.extra
            openedTemplateIds.push(selectedTemplateId)
        }

        this.setState({
            openedTemplateIds,
            selectedTemplateId,
            activeRatio: clip.ratio,
            jobRatio: clip.ratio,
            isMusic: clip.isMusic,
            testMode
        })

        this.getStatus()

        if (id === 1 && selectedTemplateId) {
            this.props.dispatch(updateClip({TemplateId: selectedTemplateId}))
        }

        await this.loadLayouts(clip.PodcastFeedId)

        if (!clip.ratio)
            this.detectRatio(clip)

        const fontList = await this.loadFontList(clip.UserClips.length && clip.UserClips[0].UserId)

        const fontsToLoad = {}
        const addFont = ([key, block]) => {
            if (block.customStyles && block.customStyles.fontFamily) {
                fontsToLoad[block.customStyles.fontFamily] = block.customStyles
            }
        }

        if (clip.config.wordsById) {
            Object.entries(clip.config.blocksById).forEach(addFont)
            Object.entries(clip.config.wordsById).forEach(addFont)
        }
        
        Object.entries(fontsToLoad).forEach(([key, fontObject]) => this.loadFont(fontObject, fontList.data))
    }

    loadFontList = (userId) => {
        const extra = userId? '?filter=1&userId='+userId:'?filter=1'
        this.fontListPromise = axios.get(`/admin/api/template/fonts${extra}`)
        this.fontListPromise.then(res => this.setState({ fonts: res.data }))
        return this.fontListPromise
    }

    loadFont = async (textObject, fontList) => {

        const fonts = fontList || this.state.fonts

        let fontObject = fonts.find(font => font.fontFamily === textObject.fontFamily)

        if (!fontObject) {
            const res = await axios.get(`/admin/api/asset/get_font?fontName=${textObject.fontFamily}`)
            fontObject = res.data

            if (!fontObject) return
        }

        let {fontFamily, cssUrl} = fontObject
        let fontLoaderConfig = {}

        if (cssUrl) {

            WebFont.load({
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

            WebFont.load({
                google: conf
            })

        }
    }

    async saveForm(){

        this.setState({saving: true})

        if (!this.state.testMode) {
            const res = await this.props.dispatch(saveClip(this.props.id))
            let {selectedTemplateId} = this.state

            const {clip, template} = res.data

            if (res.data.templatedCloned) {
                selectedTemplateId = clip.TemplateId
                this.props.dispatch(receiveTemplate(template))
                this.loadLayouts(clip.PodcastFeedId)
            }

            this.setState({saving: false, selectedTemplateId})
        }
        else {
            await this.props.dispatch(saveTemplate())
            this.setState({saving: false})
        }

    }

     process = async () => {

        const {id, clip, dispatch} = this.props

        this.setState({
            showJobForm: false,
            processing: true
        })

        await this.saveForm()

        await dispatch(processClip(id, {ratio: RATIO.PARAM_KEYS[this.state.activeRatio]}))

        AppToaster.show({
            message: 'Video processing scheduled',
            icon: 'film'
        })

        this.currentTimeout = setTimeout(this.getStatus, 10000)


        // AppToaster.show({
        //     message: res.data.error,
        //     intent: Intent.DANGER,
        //     icon: 'film'
        // })
    }

    addPayment = async () => {

        const { user } = this.props
        const result = await StripeCheckout(user.email)
        if (result) {
            this.setState({updatingBilling: true})
            await axios.put('/api/v1/account/update-billing-card', result)
            await this.props.loadUser()
            this.setState({updatingBilling: false})
        }
    }

    unlockVideo = async () => {
        const { user, clip } = this.props

        if (user.hasBilling) {
            try {
                await axios.post('/admin/api/clip/' + clip.id + '/unlock')
                this.process()
            }
            catch(e) {

            }
        }
    }

    getStatus = async (force) => {
        const {id, dispatch, clip} = this.props
        const {showJobForm} = this.state

        const res = await axios.get('/admin/api/clip/status/' + id)

        const progress = Number(res.data)

        if (progress === 1) {
            this.setState({processing: false})
        }
        else {
            this.setState({progress, processing: true})

            if (showJobForm || force) {
                this.currentTimeout = setTimeout(this.getStatus, 10000)
            }
        }
    }

    setKeyboardEvents = (event) => {

            const special = event.altKey || event.ctrlKey
            const keyName = event.code
            const activeElement = document.activeElement && document.activeElement.tagName.toLowerCase()
            const isJsonEditor = activeElement && document.activeElement.parentElement && document.activeElement.parentElement.id === 'json-body'

            console.log(activeElement)

            if (activeElement && ['button'].includes(activeElement)) {
                document.activeElement.blur()
                //return
            }

            if (activeElement && (['input', 'textarea'].includes(activeElement) || isJsonEditor)) {

                if (keyName === 'Escape')
                    document.activeElement.blur()

                return
            }

            event.preventDefault()
            event.stopPropagation()

            switch(keyName) {

                case 'ArrowRight':
                    this.setCurrentWordTime()
                    //this.selectFromKey(1)
                    break

                case 'KeyW':
                    this.setCurrentWordTime()
                    //this.selectFromKey(1)
                    break

                case 'ArrowLeft':
                    //this.selectFromKey(-1)
                    this.setCurrentWordTime()
                    break

                case 'Space':
                    this.togglePlay()
                    break
            }
    }

    forward() {
        this.wavesurfer.skipForward(5);
    }

    backward() {
        this.wavesurfer.skipBackward(5);
    }

    togglePlay() {

        const st = {
            playing: !this.state.playing,
            selectedMediaId: null,
        }

        if (!this.analyser) {
            this.createMediaElementAnalyser()
        }

        this.setState(st)
    }

    selectFromKey(direction) {

        const wordsArray = this.props.clip.config.wordIds;
        let wordId = wordsArray[0];

        if (this.state.activeRegion) {
            const index = wordsArray.indexOf(this.state.activeRegion.id)
            wordId = wordsArray[index + direction]

            if (!wordId) {
                return
            }
        }

        this.selectRegion(wordId)
    }

    handleReady(e) {

        const config = this.props.clip.config

        this.wavesurfer = e.wavesurfer

        const container = document.querySelector('wave')

        this.setState({
            containerWidth: container.offsetWidth
        })


    }

    createWebAudioAnalyser = () => {
        const audioBackend = this.wavesurfer.backend;
        audioBackend.createAnalyserNode()


        this.analyser = audioBackend.analyser;
        this.analyser.smoothingTimeConstant = 0.9;
        this.analyser.fftSize = 1024;
        audioBackend.setFilters(this.analyser)
    }

    createMediaElementAnalyser = () => {
        const audio = this.wavesurfer.backend.media
        const context = new AudioContext()
        const source = context.createMediaElementSource(audio)
        this.analyser = context.createAnalyser()
        this.analyser.connect(context.destination)
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = 0.9;
        this.frequencyBuffer = new Uint8Array(this.analyser.frequencyBinCount)
        source.connect(this.analyser)
    }

    onPlay() {
        this.setState({playing: true})
    }

    onPause() {
        this.setState({
            playing: false,
            regionPlaying: false
        })
    }

    onPlayed() {
        this.setState({
            playing: false,
            regionPlaying: false
        })
    }

    getFrameNumberFromTime(ms) {
        return Math.round(ms * 0.04);
    }

    handleSingleRegionUpdate(list, e) {


        const selectedRegion = e.region;

        this.props.dispatch(updateWords(list))
        this.debounceUpdateTimeline(true, list)
    }

    handleSingleRegionClick(e) {

        if (!this.disableRegionClick) {

            this.selectRegion(e.region.id);

            const inputEl = document.getElementById(e.region.id);
            if (inputEl) {
                inputEl.focus();
                inputEl.setSelectionRange(0, inputEl.value.length);
            }
        }
    }

    createEmptyWord() {
        this.props.dispatch(createWord(this.state.pos, this.state.newword))
        this.closeInsertWordPopover()
    }

    closeInsertWordPopover() {
        this.setState({
            insertWordOpen:false,
            newword: ''
        })
    }



    updateGlobalSettings(values) {
        this.props.dispatch(updateGlobal(values))
    }

     handleSingleRegionIn = (e) => {
        this.selectRegion(e.region.id)
    }

    updateDisplayTime(currentTime) {

        const cleanTime = parseFloat(currentTime.toFixed(2))
        const currentFrame = this.getFrameNumberFromTime(cleanTime * 1000)

        this.setState({
            pos: cleanTime,
            currentFrame: currentFrame
        })
    }

    posChange(currentTime){



        this.seekAnimations(currentTime)

        this.throttleProgressChange(currentTime)

        try {
            //get fft
            this.analyser.getByteFrequencyData(this.frequencyBuffer)
            const fft = this.state.isMusic? this.frequencyBuffer : this.frequencyBuffer.slice(2, 256)
            document.dispatchEvent(new CustomEvent('fftDataUpdate', {detail: fft }))
            document.dispatchEvent(new CustomEvent('progress', {detail: currentTime / this.wavesurfer.getDuration()}))
        }
        catch(e){

        }
    }

    seekAnimations(currentTime) {
        this.templatesTimeline.seek(currentTime)
        this.wordsTimeline.seek(currentTime)
    }



    handleAudioRateChange(e) {
        this.setState({
            audioRate: +e.target.value
        });
    }

    parseSeconds(seconds) {
        var sec_num = parseFloat(seconds, 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        return {hours, minutes, seconds};
    }

    unselectRegion(cb) {

        var regionElement = null;

        this.setState({
            activeRegion: null,
            selectedBlockIndex: null
        }, ()=> {
            if (cb) {
                cb(regionElement);
            }
        });
    }

    setTab(tab) {

        //clear leftover animations
        if (tab === 'template'){
            const cam =  document.getElementById('template-camera')
            if (cam) cam.style.opacity = 1
        }

        let entityId = ''
        if (this.state.testMode){
            entityId = this.getTemplateId()
        }

        this.props.history.push(`/clip/${this.props.id}/${tab}/${entityId}`)
    }

    isTabActive(tab) {
        const activeTab = this.props.match.params.entityId || SECTIONS.CLIP
        return activeTab === tab
    }

    getTabClass(tab) {
        return this.isTabActive(tab) ? '' : 'hide';
    }

    splitBlock = (blockId, wordIndexInBlock) => {
        this.props.dispatch(splitBlock(blockId, wordIndexInBlock))
        this.syncAnimations()
    }

    mergeBlock = (blockId) => {
        this.props.dispatch(mergeBlock(blockId))
        setTimeout(() => this.setCurrentBlockFromWordId(this.state.activeRegion.id), 50)
        this.syncAnimations()
    }

    wordChange = (wordId, propertyName, value) => {
        this.props.dispatch(updateWord(wordId, {
            [propertyName]: value
        }))

        this.debounceUpdateTimeline()
    }

    setCurrentWordTime = () => {
        const originalTime = this.wavesurfer.getCurrentTime()
        const adjustedTime = (originalTime * 100 - 10) / 100


        const {activeRegion} = this.state

        if (!activeRegion) return

        const {wordIds, wordsById} = this.props.clip.config

        const wordIndex = wordIds.indexOf(activeRegion.id)
        const prevWordId = wordIds[wordIndex - 1]
        const nextWordId = wordIds[wordIndex + 1]

        let update = {
            [activeRegion.id] : {
                start: adjustedTime
            }
        }

        if (prevWordId) {
            update[prevWordId] = {
                end: adjustedTime
            }
        }

        this.props.dispatch(updateWords(update))

        if (nextWordId) {
            //this.setState({ activeRegion: wordsById[nextWordId] })
            this.selectRegion(nextWordId)
        }

    }

    selectWord = (wordId) => {

        this.selectRegion(wordId);

        const clip = this.wavesurfer.regions.list[wordId];

        if (clip) {
            this.scrollToOffset(clip.element.offsetLeft);
            const time = (clip.start + ((clip.end - clip.start) / 3)) / clip.wavesurfer.getDuration()
            this.wavesurfer.seekTo(time);
        }

    }

    scrollToOffset(offset) {
        const wavesurferContainer = document.querySelector('.wavesurfer-container');
        if (wavesurferContainer) {
            wavesurferContainer.scrollLeft = offset - wavesurferContainer.offsetWidth / 2;
        }
    }

    selectRegion(id) {

        const {wordsById, blockIds} = this.props.clip.config

        const word = wordsById[id]
        const blockIndex = blockIds.indexOf(word.blockId)

        this.setState({
            activeRegion: this.props.clip.config.wordsById[id],
            selectedBlockIndex: blockIndex,
            showActions: false,
            selectedMediaId: null
        })

        //this.setCurrentBlockFromWordId(id);
    }

    deleteWord = (wordId) => {
        try {
            this.unselectRegion(() => {
                try {
                    this.props.dispatch(deleteWord(wordId))
                }
                catch (e) {}
            })
        }
        catch (e) {
            //console.(e)
        }
        //this.debounceUpdateTimeline()
    }


    splitWord = (wordId) => {
        this.unselectRegion(() => this.props.dispatch(splitWord(wordId)))
        this.debounceUpdateTimeline()
    }

    updateBlock = (blockId, values) => {
        this.props.dispatch(updateBlock(blockId, values))
    }

    clipChange(e) {

        const prop = e.target.name

        this.props.dispatch(updateClip({[prop]: e.target.value}))
    }

    showChange = (val) => {
        this.props.dispatch(updateClip({PodcastFeedId: val.id}))
    }

    insertImage(image, selectedObject) {

        if (image.width <= 720 || image.height <= 720) {
            image.top = Math.round((720 - image.height)/2)
            image.left = Math.round((720 - image.width)/2)
        }

        if (image.width > image.height && image.width > 720) {
            image.width = 720/image.height * image.width
            image.height = 720
            image.top = 0
            image.left = - Math.round((image.width - 720)/2)
        }

        if (image.height > image.width && image.height > 720) {
            image.height = 720/image.width * image.height
            image.width = 720
            image.left = 0
            image.top = - Math.round((image.height - 720)/2)
        }

        if (image.height === image.width && image.height > 720) {
            image.height = 720
            image.width = 720
            image.top = 0
            image.left = 0
        }

        if (this.isTabActive(SECTIONS.CLIP)) {

            const {selectedMediaId} = this.state
            const {mediasById} = this.props.clip.config
            const selectedMedia = mediasById[selectedMediaId]

            if (selectedObject) {


                let imageStyle = image

                const updates = {
                    url: image.url,
                    name: image.name,
                    imageStyle,
                }

                if (selectedMedia.during.cssProperty === 'scale') {
                    updates.during = {
                        originX: Math.round(image.width/2),
                        originY: Math.round(image.height/2),
                    }
                }

                this.setState({selectedMediaId: null}, () => {

                    this.props.dispatch(updateMedia(selectedMediaId, updates))
                    this.setState({selectedMediaId})
                })


            }
            else {

                const createMediaAction = createMedia({
                    name: image.name,
                    url: image.url,
                    pos: this.state.pos,
                    imageStyle: image
                })

                this.props.dispatch(createMediaAction)
                this.selectMedia(createMediaAction.id)
            }

            this.setState({
                showAssets: false,
                replaceMedia: false
            }, this.syncAnimations)

        }

        if (this.isTabActive(SECTIONS.TEMPLATE)) {
            this.templateEditor.insertImage(image, selectedObject)
        }

    }

    selectMedia(id) {

        if (id === 'no') return

        const {selectedMediaId} = this.state
        const {mediasById} = this.props.clip.config

        let state = {
            selectedMediaId: id,
            activeRegion: null
        }

        if (selectedMediaId != null && selectedMediaId === id) {
            state.selectedMediaId = null
        }

        if (state.selectedMediaId === null) {
            this.debounceUpdateTimeline()
        }

        this.setState(state)

        const media = mediasById[id]
        const {time} = media.general

        if (state.selectedMediaId) {
            this.wavesurfer.setCurrentTime(Number(time) + 0.2)
            const container = document.querySelector('wave')
            const left = (time / this.wavesurfer.getDuration()) * container.offsetWidth;

            this.scrollToOffset(left);
        }


        this.debounceSetActiveMedias()
    }

    updateMedia(id, values, callback) {
        this.props.dispatch(updateMedia(id, values))
    }

    onMediaDurationChange(data, id) {
        const container = document.querySelector('wave');
        const totalTime = this.wavesurfer.getDuration();
        const val = (data.x / container.offsetWidth) * totalTime
        this.props.dispatch(updateMedia(id, {general: {duration: val.toFixed(2)}}))
        this.syncAnimations()
    }

    onMediaStartTimeChange(data, id) {

        const media = this.props.clip.config.mediasById[id]
        const container = document.querySelector('wave');
        const totalTime = this.wavesurfer.getDuration();
        const val = Number(media.general.time) + (data.x / container.offsetWidth) * totalTime
        this.props.dispatch(updateMedia(id, {general: {time: val.toFixed(2)}}))
        this.syncAnimations()
    }

    removeMedia(id) {
        const {selectedMediaId} = this.state
        this.setState({selectedMediaId: null}, () => {
            this.props.dispatch(deleteMedia(selectedMediaId))
        })
    }

    cloneMedia = (id) => {
        const {selectedMediaId} = this.state

        const medias = this.getSortedMedias()

        const lastMedia = medias[medias.length - 1]
        const startTime = parseFloat(lastMedia.general.time);
        const endTime = parseFloat(lastMedia.general.endtime);
        const duration = parseFloat(lastMedia.general.duration);

        const newTime = (lastMedia.general.timing === 'endtime' ? endTime : startTime + duration);

        this.setState({selectedMediaId: null}, () => {
            this.props.dispatch(cloneMedia(selectedMediaId, newTime - 0.1))
        })
    }


    renderRegion(regionId) {



        if (!regionId) {
            return <span />
        }

        const word = this.props.clip.config.wordsById[regionId]

        if (!word) {
            return <span />
            }


        return <section>
            <Tag
                className={'btn-playregion ' + Classes.SMALL + (word.word === ''?' empty':'')}
                interactive={true}
                active={false}
                intent={Intent.PRIMARY}
                onClick={e => this.playRegion(regionId)}
            >{word.word || 'empty'}</Tag>
        </section>
    }

    playRegion(id) {
        let st = {
            regionPlaying: id,
            playing: true,
        }

        if (this.state.regionPlaying) {
            st = {
                regionPlaying: false,
                playing: false
            }
        }

        this.setState(st)
    }

    onTimeChange(val) {
        this.setState({
            pos: val
        })
        this.debounceSeek(val)
    }

    handleLayoutChange(layout) {
        this.props.dispatch(updateClip({TemplateId: layout.id}))

        const {activeRegion} = this.state
        if (activeRegion) {
            this.unselectRegion()
        }
    }

    createTemplate() {
        this.handleLayoutChange({id: 'create'})
    }

    toggleDetails() {
        this.setState({showDetails: !this.state.showDetails})
    }

    toggleJobForm() {

        const showJobForm = !this.state.showJobForm

        if (showJobForm)
            this.getStatus(true)

        this.setState({showJobForm})
    }

    setBindings() {

        this.handleMediaChange = this.updateMedia.bind(this);
        this.handleMediaDelete = this.removeMedia.bind(this);
        this.handleSelectMedia = this.selectMedia.bind(this);

        this.handleTimeChange = this.onTimeChange.bind(this)
        this.debounceUpdateTimeline = debounce(this.initWordsTimeline, 200)
        this.debounceSeek = debounce(value => this.wavesurfer.setCurrentTime(value), 500)
    }



    setRatio = (ratio) => {
        this.setState({
            activeRatio: ratio,
            jobRatio: ratio
        })

        this.props.dispatch(updateClip({ratio}))
    }

    toggleDelete() {
        this.setState({
            confirmDialog: !this.state.confirmDialog
        })
    }

    deleteClip() {
        this.setState({saving: true})
        axios.delete(`/admin/api/clip/${this.props.id}`).
        then(res => this.props.refresh()).
        then(res => {
            this.resetAll()
            this.props.history.push(`/library`)
        })
    }

    cloneSelected() {
        let newRecord = null
        this.setState({saving: true})
        axios.post(`/admin/api/clip/clone/${this.props.clip.id}`).
        then(res => {
            newRecord = res.data
            return this.props.refresh()
        }).
        then(res => {
            this.resetAll()
            this.props.history.push('/clip/'+ newRecord.id)
        })
    }


    resetAll(){
        this.setState({
            insertMenu: false,
            insertWordOpen: false,
            saving: false,
            confirmDialog:false
        })
    }

    toggleInsertMenu() {
        this.setState({
            insertMenu: !this.state.insertMenu
        })
    }

    getTemplateId() {
        const {clip} = this.props

        if (this.state.testMode) {
            return this.state.selectedTemplateId
        }

        return clip.TemplateId
    }

    onInsertImage() {

        this.setState({
            insertMenu: false,
            insertWordOpen: false,
            showAssets: true
        })
    }

    getLayoutRangeForBlock(blockId) {

        const {templatesById} = this.state

        const clipConfig = this.props.clip.config
        let mainLayoutId = this.getTemplateId()

        const sortedBlocks = clipConfig.blockIds.map(blockId => {
            let block = clipConfig.blocksById[blockId]
            const wordIds = block.wordIds
            block.start = clipConfig.wordsById[wordIds[0]].start
            block.end = clipConfig.wordsById[wordIds[wordIds.length - 1]].end
            return block
        })

        const getLayout = block => {
            const layoutId = block.layout? block.layout:mainLayoutId
            let res = templatesById[layoutId]

            if (!res) {
                console.warn('template '+ layoutId + ' was removed')
                res = templatesById[mainLayoutId]
            }

            return res
        }

        let currentLayout = {
            layout: getLayout(sortedBlocks[0]),
            start:0
        }

        //represents the effective time range of a specific layout in the context of the whole clip
        let scheduledLayouts = [currentLayout]
        let scheduledLayoutByBlockId = {
            [sortedBlocks[0].id]: currentLayout
        }

        sortedBlocks.forEach((sortedBlock, index) => {

            const layout = getLayout(sortedBlock)

            if (layout && layout.id !== currentLayout.layout.id) {
                currentLayout.end = sortedBlock.start

                currentLayout = {
                    start: sortedBlock.start,
                    layout: layout
                }

                scheduledLayouts.push(currentLayout)
            }

            if (index === sortedBlocks.length - 1) {
                currentLayout.end = this.props.clip.totalDuration
            }

            scheduledLayoutByBlockId[sortedBlock.id] = currentLayout
        })

        return scheduledLayoutByBlockId[blockId];
    }

    updateMediaHelper(id, property, value) {
        const shallow = this.state.mediaCanvas.getObject('shallow')
        if (shallow) {
            this.state.mediaCanvas.updateObject('shallow', property, value)
            //this.forceUpdate()
        }
    }


    getSortedMedias() {

        const {selectedMediaId} = this.state
        const {mediasById} = this.props.clip.config

        const mediaIds = Object.keys(mediasById || {})

        if (!mediaIds.length) {
            return [{
                label: 'No Overlays',
                id: 'no',
                disabled: true
            }]
        }

        let sortedMedias = []
        for (let mediaId in mediasById) {
            let media = mediasById[mediaId]
            const index = sortedIndexBy(sortedMedias, media, m => parseFloat(m.general.time))
            sortedMedias.splice(index, 0, media)
        }

        return sortedMedias.map(media => {
            return {
                key: media.id,
                id: media.id,
                label: media.name,
                icon: media.gifSettings? CustomIcons.gifIcon: CustomIcons.picIcon,
                selectedClass: media.id === selectedMediaId? 'selected':'',
                startTime: Util.getPlaybackTime(media.general.time, true),
                general: media.general,
                imageUrl: media.url
            }
        })
    }



    syncAnimations = () => {

        setTimeout(() => {
            console.log('INIT TIMELINES')
            this.initTemplateTimeline()
            this.initWordsTimeline()
        }, 500)

    }

    initWordsTimeline(noRefreshTextFit, wordsUpdated) {

        const {template, clip} = this.props
        const config = clip.config

        const {activeRatio} = this.state
        const {textArea} = template[activeRatio].linkedElements

        const viewport = RATIO.DIMENSIONS[activeRatio]
        const wordsTimeline = this.wordsTimeline

        const wordIds = wordsUpdated? Object.keys(wordsUpdated) : null
        Utils.addWordsToTimeline({
            wordsTimeline,
            viewport,
            config,
            textArea
        }, noRefreshTextFit, wordIds)

        this.wavesurfer && this.seekAnimations(this.wavesurfer.getCurrentTime())
    }

    initTemplateTimeline(){

        const {template, clip} = this.props
        const {wordsById, wordIds} = clip.config
        const {activeRatio, activeRegion} = this.state
        const config = template[activeRatio]
        const viewport = RATIO.DIMENSIONS[activeRatio]

        let layoutRange = {
            start: 0,
            end: clip.totalDuration,
            layout: template,
        }

        if (wordIds) {
            const selectedWordId = activeRegion? activeRegion.id:wordIds[0]
            const selectedWord = wordsById[selectedWordId]

            //deactivating the ability to set specific template by block. Might bring that back later
            //layoutRange = this.getLayoutRangeForBlock(selectedWord.blockId)
        }

        const templatesTimeline = this.templatesTimeline
        const speakerRange = Utils.getSpeakerRanges(clip.config)


        if (layoutRange.layout) {

            Utils.addTemplateToTimeline({
                templatesTimeline,
                viewport,
                config,
                layoutRange,
                speakerRange
            })

            this.currentLayoutId = layoutRange.layout.id
        }
    }

    templateTabChange(id) {

        if (id === 'actions') {
            return
        }

        this.setState({
            selectedTemplateId: id
        })

        this.props.history.push(`/clip/${this.props.id}/template/${id}`)
    }


    closeTemplate(id, e) {
        e && e.stopPropagation()

        let {openedTemplateIds} = this.state
        const index = openedTemplateIds.indexOf(id)
        if (index === -1) return

        openedTemplateIds.splice(index, 1)

        let selectedTemplateId = null
        if (openedTemplateIds.length && selectedTemplateId === id) {
            const selectedTemplateIndex = (index === openedTemplateIds.length - 1? 0:index)
            selectedTemplateId = openedTemplateIds[selectedTemplateIndex]
        }

        this.setState({
            openedTemplateIds,
            selectedTemplateId
        })
    }


    cloneTemplate(templateId) {

        //get latest state of this template (in case user has started editing from the cloned one)
        if (!this.props.template.id === templateId) {
            return
        }

        const {name, PodcastFeedId, configSquare, configWide, configVertical} = this.props.template

        let {templatesById, openedTemplateIds} = this.state
        const clonedTemplate = {
            id: 'clone',
            name: `Clone of ${name}`,
            PodcastFeedId,
            configSquare,
            configVertical,
            configWide
        }
        templatesById = Object.assign({
            'clone': clonedTemplate
        }, templatesById)

        const selectedTemplateId = 'clone'
        openedTemplateIds.push(selectedTemplateId)

        this.setState({
            templatesById,
            openedTemplateIds,
            selectedTemplateId
        }, () => {
            this.handleLayoutChange(clonedTemplate)
        })
    }

    onTemplateNameChange = (id, name) => {
        let {templatesById} = this.state
        templatesById[id].name = name
        this.setState({templatesById})
    }

    onDeleteTemplate(templateId) {
        //get latest state of this template (in case user has started editing from the cloned one)
        if (!this.props.template.id === templateId) {
            return
        }

        let {templatesById} = this.state

        axios.delete('/admin/api/template/' + templateId).
        then(res => {
            this.closeTemplate(templateId)
            delete templatesById[templateId]
            this.setState({
                templatesById
            })
        })
    }

    undo() {
        if (this.isTabActive(SECTIONS.TEMPLATE)) {
            this.props.dispatch(undoTemplate())
        }

        if (this.isTabActive(SECTIONS.CLIP || SECTIONS.TRANSCRIPT)) {
            this.props.dispatch(undoClip())
        }
    }


    redo() {

        if (this.isTabActive(SECTIONS.TEMPLATE)) {
            this.props.dispatch(redoTemplate())
        }

        if (this.isTabActive(SECTIONS.CLIP || SECTIONS.TRANSCRIPT)) {
            this.props.dispatch(redoClip())
        }
    }

    editTemplate(selectedTemplateId) {
        this.setState({
            selectedTemplateId
        })
        //this.setTab(SECTIONS.TEMPLATE)

        this.props.history.push(`/clip/${this.props.id}/template/${selectedTemplateId}`)
    }

    toggleAssets = (selectedObject) => {
        const {showAssets} = this.state
        this.setState({
            showAssets: !showAssets,
            selectedObject,
        })
    }

    onScaleChange = viewportScale => {
        if (HasStorage) {
            localStorage.setItem('viewportScale', viewportScale.toString())
        }
        this.setState({viewportScale})
    }

    updateName = e => {
        this.props.dispatch(updateClip({name: e.target.value}))
    }

    selectScaleOrigin = (selectScaleTransitionType) => {
        this.setState({
            scaleSelectMode: !this.state.scaleSelectMode,
            selectScaleTransitionType
        })
    }

    onPointSelection = (e) => {

        const {activeRatio, specialKey, selectScaleTransitionType, selectedMediaId} = this.state
        const {mediasById} = this.props.clip.config
        const media = mediasById[selectedMediaId]

        const layoutConfig = this.props.template[activeRatio]
        if (!layoutConfig) return

        const scale = this.state.viewportScale
        const box = e.currentTarget.getBoundingClientRect()
        const x = Math.round(e.clientX/scale - box.left/scale)// - media.imageStyle.left
        const y = Math.round(e.clientY/scale - box.top/scale)// - media.imageStyle.top


        // this.updateGlobalObject('showTransition', {
        //     originX: x,
        //     originY: y
        // })

        this.handleMediaChange(selectedMediaId, {
            [selectScaleTransitionType]: {
                originX: x,
                originY: y
            }
        })

        this.selectScaleOrigin()
    }

    toggleImportLyrics = () => {
        this.setState({showTextImport: !this.state.showTextImport})
    }

    importText = (text) => {
        this.props.dispatch(importText(text, this.state.pos));
        this.setState({showTextImport: false})
        this.syncAnimations()
    }

    toggleShiftBlock = (selectedBlock) => {
        const res = this.props.dispatch(canShiftWords(selectedBlock, this.state.pos, this.wavesurfer.getDuration()))

        this.setState({
            shiftBlock: selectedBlock,
            cannotShiftBlock: !res
        })
    }

    cloneBlock = (selectedBlock) => {
        const { pos, shiftBlock } = this.state
        const canAddBlock = this.props.dispatch(insertMode(pos))

        if (canAddBlock) {
            this.props.dispatch(cloneBlock(selectedBlock.id, pos));
        }

        this.syncAnimations()
    }

    deleteBlock = (selectedBlock) => {
        this.props.dispatch(deleteBlock(selectedBlock.id));
    }

    closeShiftBlock = () => {
        this.setState({
            shiftBlock: null,
            cannotShiftBlock: false
        })
    }

    shiftBlock = () => {
        const { pos, shiftBlock } = this.state
        this.props.dispatch(shiftBlocks(shiftBlock.id, pos));
        this.closeShiftBlock()
        this.syncAnimations()
    }

    addBlockOrWord = _ => {
        const canAddBlock = this.props.dispatch(insertMode(this.state.pos))

        if (canAddBlock)
            this.props.dispatch(addBlock(this.state.pos))
        else
            this.props.dispatch(createWord(this.state.pos, this.state.newword))
    }


    setAudioRate = (audioRate) => {
        this.setState({audioRate})
    }


    render() {

        const {clip, history, myFeeds, template, feeds, renderNavigation,
            feedsById, id, templateHistory, clipHistory, match, user} = this.props

        if (!user.isLoggedIn) {
            history.push('/')
        }


        let {
            testMode,
            scaleSelectMode, playing, showJobForm, activeRatio, selectedMediaId, mediaCanvas,
            fonts,
            viewportScale,
            activeTab,
            showOverflow,
            templatesById,
            activeRegion,
            progress,
            processing,
            showAssets,
            selectedObject,
            selectedTemplateId,
            saving,
            isMusic,
            showTextImport,
            cannotShiftBlock,
            audioRate
        } = this.state

        if (!id || !clip || !clip.config) {
            return <div />
        }

        if (match.params.entityId) {
            //selectedTemplateId = match.params.entityId
        }

        //console.log(selectedTemplateId)


        const viewMode = !this.isTabActive(SECTIONS.TEMPLATE)

        const {loading} = clip

        const {mediasById, blocksById, wordsById, blockIds, wordIds} = clip.config
        const selectedMedia = mediasById && mediasById[selectedMediaId]

        const templates = templatesById && Object.values(templatesById)

        let mainLayoutId = this.getTemplateId()

        const mainTemplate = templatesById && templatesById[mainLayoutId]

        

        const templateConfig = mainTemplate && mainTemplate[activeRatio]

        const selectedWordId = activeRegion? activeRegion.id:(wordIds && wordIds.length && wordIds[0])
        const selectedWord = wordsById && wordsById[selectedWordId]
        const selectedBlock = blocksById && selectedWord && blocksById[selectedWord.blockId || 0]

        const defaultTemplateId = (selectedBlock && selectedBlock.layout) || mainLayoutId
        const activeTemplateId = defaultTemplateId//selectedTemplateId || defaultTemplateId

        const show = clip.PodcastFeedId && feedsById[clip.PodcastFeedId]

        const pastTemplates = templateHistory.past
        //Editor Specific
        const canBuild = !processing && mainLayoutId
        let canUndoTemplate =  templateHistory.past.length
        if (pastTemplates.length && pastTemplates[pastTemplates.length-1].id !== selectedTemplateId) {
            canUndoTemplate = false
        }
        const canUndoClip = clipHistory.past.length
        const canUndo = canUndoTemplate || canUndoClip


        const canRedo = clipHistory.future.length || templateHistory.future.length
        const canSave = template && clip && (template.touched || clip.touched)

        const canEditTemplate = mainTemplate && mainTemplate.UserTemplates && mainTemplate.UserTemplates.find(userTemplate => userTemplate.UserId === user.id)
        const sortedMedias = this.getSortedMedias();

        const canEdit = clip.isEditor || clip.isOwner

        const timelineActionsMenu = <div className={'timeline-actions'}>
            <Button
                className={'margin-bottom-10'}
                minimal={true}
                fill={true}
                intent={Intent.PRIMARY}
                icon={'add-to-artifact'}
                text={'Insert Word/Text Block'}
                onClick={this.addBlockOrWord} />
            <Button
                fill={true}
                minimal={true}
                className={'margin-bottom-10'}
                intent={Intent.WARNING}
                onClick={this.onInsertImage.bind(this)}
                icon={'add'}
                text={'Insert Image/GIF'} />
            <Button
                fill={true}
                icon={'camera'}
                text={'Set Clip Thumbnail'}
                onClick={e => this.updateGlobalSettings({pictureTime: this.state.pos})}
            />


        </div>


        const canExportFree = clip.lastProcessed? dayjs().diff(clip.lastProcessed, "hours") > 24 : true
        const timeUnlock = dayjs(clip.lastProcessed).add(1, 'day')


        let jobFormContent = <div className='clip-details-popover'>
            <H5>Export Your Video</H5>

            {
                clip.unlocked && <div>
                    <div className={'margin-bottom-10'}>Thank you for unlocking this clip. </div>
                    <Button
                        intent={Intent.PRIMARY}
                        disabled={!canBuild}
                        onClick={this.process}
                        className='margin-top-10 margin-bottom-30'
                        text='Export Clip'
                    />
                </div>
            }
            {
                !clip.unlocked && <div>
                    <div>Export your video with no watermark and as many times as you want for $2</div>
                    <Button
                        intent={Intent.PRIMARY}
                        disabled={!canBuild}
                        onClick={this.unlockVideo}
                        className='margin-top-10 margin-bottom-30'
                        text='Unlock unlimited Exports'
                    />

                    {
                        canExportFree && <div>
                            <div>Or export for free with a watermark (limited to 1 video a day)</div>
                            <Button
                                disabled={!canBuild}
                                onClick={this.process.bind(this)}
                                className='margin-top-10'
                                text='Export with watermark'
                            />
                        </div>
                    }

                    {
                        !canExportFree && <div>
                            <div>You have reached the limit of free export.</div>
                        </div>
                    }

                </div>
            }


            {
                clip.lastProcessed &&
                <div className='is-size-7 margin-top'>
                    Last video was exported <TimeAgo date={clip.lastProcessed} />
                    <a onClick={_ => history.push('/library/myclips/' + clip.id)}> View Clip</a>
                </div>
            }
        </div>

        if (processing) {
            jobFormContent = <div className='clip-details-popover'>
                <H5>Export in progress...</H5>

                <div className={'margin-bottom-10'}>Your clip is being processed.</div>
                <div className={'margin-bottom-10'}>Progress</div>
                <ProgressBar intent={Intent.PRIMARY} value={progress} />
            </div>
        }

        const JobForm = <Popover
            isOpen={showJobForm}
            onClose={e => this.setState({showJobForm: false})}
            position={Position.BOTTOM_LEFT}
            target={!processing?<NiceButton
                disabled={!canBuild}
                intent={'link'}
                text={'Export'}
                icon="cloud-download-alt"
                onClick={this.toggleJobForm.bind(this)}
            />:<NiceButton
                className={'rotating'}
                icon={'cog'}
                intent={'link'}
                text={'Export'}
                onClick={this.toggleJobForm.bind(this)}>
            </NiceButton>}

            content={jobFormContent}
        />

        const ClipConfigMenu = <Menu>
            <MenuItem
                text="Open in Library"
                icon={CustomIcons.libraryIcon}
                onClick={e => history.push(`/library/clip/${id}`)}
            />
            <MenuItem
                text="Clone"
                icon="duplicate"
                onClick={this.cloneSelected.bind(this)}
            />
            <MenuItem
                intent={Intent.DANGER}
                text="Delete"
                icon="trash"
                onClick={this.toggleDelete.bind(this)}
            />
        </Menu>



        let minPxPerSec = 180

        // if (clip.totalDuration < 60 * 3) {
        //     minPxPerSec = 200
        // }

        if (clip.totalDuration > 60 * 10) {
            minPxPerSec = 100
        }

        const waveOptions = {
            fillParent: false,
            height: 68,
            progressColor: '#5c7080',
            waveColor: '#8A9BA8',
            normalize: true,
            audioRate: audioRate,
            cursorColor: 'rgb(50, 115, 220)',
            cursorWidth: 1,
            interact: true,
            minPxPerSec: minPxPerSec,
            pixelRatio: 1,
            autoCenter: false,
            backend: 'MediaElement'
        }

        const timelineOptions = {
            timeInterval: 1,
            height: 10,
            primaryFontColor: '#BFCCD6',
            secondaryFontColor: '#BFCCD6',
            primaryColor: 'rgba(16, 22, 26, 0.1)',
            secondaryColor: 'rgba(16, 22, 26, 0.1)',
            fontFamily: 'Helvetica',
            notchPercentHeight: 50,
            fontSize: 12,
            labelPadding: 8,
            formatTimeCallback: s => {
                const {hours, minutes, seconds} = this.parseSeconds(s)
                return (minutes? `${minutes}m`:'') + `${seconds}s`
            }
        }


        const viewport = RATIO.DIMENSIONS[activeRatio]



        return (
            <div className={'clip-editor-wrapper '}>

                <Prompt
                    when={canSave}
                    message={location =>
                        location.pathname.startsWith("/clip/"+id)? true:`You have unsaved changes. Would you like to leave the Clip Editor?`
                    }
                />

                {/*<Loading show={this.state.saving}/>*/}

                <Alert
                    intent={Intent.DANGER}
                    icon="trash"
                    isOpen={this.state.confirmDialog}
                    onConfirm={this.deleteClip.bind(this)}
                    onCancel={this.toggleDelete.bind(this)}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete">

                    <p>Would you like to delete <strong>{clip.name}</strong>?</p>
                </Alert>

                {
                    this.state.shiftBlock && <Alert
                        intent={Intent.PRIMARY}
                        icon="time"
                        isOpen={this.state.shiftBlock}
                        onConfirm={cannotShiftBlock? this.closeShiftBlock : this.shiftBlock}
                        onCancel={cannotShiftBlock? null : this.closeShiftBlock}
                        cancelButtonText={cannotShiftBlock? null : "Cancel"}
                        confirmButtonText={cannotShiftBlock? "Cancel":"Shift Block"}>

                        {
                            cannotShiftBlock && <p>There is not enough room to shift this block. Clip is too short.</p>
                        }

                        {
                            !cannotShiftBlock && <p>This will shift this block start time and all its following blocks.</p>
                        }

                    </Alert>
                }

                {
                    showTextImport && <TextImporter
                        onClose={this.toggleImportLyrics}
                        onImport={this.importText}
                    />
                }

                {
                    renderNavigation && renderNavigation(<React.Fragment>

                            <div className='bu-navbar-start'>
                                <div className='bu-navbar-item'>
                                    <div className="bu-buttons bu-has-addons bu-is-centered">

                                        <NiceButton
                                            minimal={!this.isTabActive(SECTIONS.CLIP)}
                                            intent={Intent.PRIMARY}
                                            active={this.isTabActive(SECTIONS.CLIP)}
                                            onClick={e => this.setTab(SECTIONS.CLIP)}
                                            icon="film"
                                            text="Edit Clip"
                                            //className={Classes.MINIMAL}
                                        />

                                        <NiceButton
                                            minimal={!this.isTabActive(SECTIONS.TEMPLATE)}
                                            disabled={!activeTemplateId}
                                            intent={Intent.PRIMARY}
                                            active={this.isTabActive(SECTIONS.TEMPLATE)}
                                            onClick={e => this.setTab(SECTIONS.TEMPLATE)}
                                            icon="paint-brush"
                                            text="Edit Templates"
                                            //className={Classes.MINIMAL}
                                        />


                                    </div>


                                </div>


                                {
                                    canEdit &&
                                    <div className='bu-navbar-item'>

                                        <NiceButton
                                            intent={'link'}
                                            loading={loading || saving}
                                            onClick={this.saveForm.bind(this)}
                                            disabled={!canSave}
                                            icon="save"
                                        />

                                    </div>
                                }

                                {
                                    !testMode &&  (canEdit) && <div className='bu-navbar-item'>

                                        {
                                            JobForm
                                        }

                                    </div>
                                }

                                <div className='bu-navbar-item'>
                                    <NiceButton
                                        text={'Undo'}
                                        intent={'link'}
                                        disabled={!canUndo}
                                        onClick={this.undo.bind(this)}
                                        icon="undo" />
                                </div>

                                <div className='bu-navbar-item'>
                                    <NiceButton
                                        intent={'link'}
                                        minimal={true}
                                        onClick={this.syncAnimations}
                                        text={'Sync Animations'}
                                        icon="sync"
                                    />
                                </div>

                            </div>

                            <div className='bu-navbar-end'>
                                <div className='bu-navbar-item'>
                                    <NiceButton
                                        text={'Assets Library'}
                                        intent={Intent.PRIMARY}
                                        minimal={!showAssets}
                                        active={showAssets}
                                        icon={'photo-video'}
                                        onClick={_ => this.toggleAssets()}
                                    />
                                </div>
                            </div>

                    </React.Fragment>)
                }


                <section className={this.isTabActive(SECTIONS.TRANSCRIPT)? 'hide':'template-editor-wrapper'}>

                    <div className='clip-editor-zoom'>
                        <Slider
                            min={0.5}
                            max={1}
                            stepSize={0.05}
                            onChange={this.onScaleChange}
                            labelRenderer={false}
                            //renderLabel={val => `${Math.round(val * 100)}%`}
                            value={viewportScale}
                        />

                        <Switch label={'Show Overflow'} checked={showOverflow} onChange={e => this.setState({showOverflow: !showOverflow})} />
                    </div>

                    {
                        templates && fonts &&
                        <TemplateEditor

                            viewMode={viewMode}
                            ref={ref => this.templateEditor = ref}

                            toggleAssets={this.toggleAssets}

                            feeds={feeds}

                            myFeeds={myFeeds}
                            templatesById={templatesById}
                            ratio={activeRatio}
                            viewportScale={viewportScale}
                            selectedMediaId={selectedMediaId}
                            feedsById={feedsById}
                            id={activeTemplateId}
                            switchRatio={this.setRatio}
                            isMusic={isMusic}

                            allWordsById={wordsById}
                            onWordSelect={this.selectWord}
                            selectedWordId={selectedWordId}
                            onWordChange={this.wordChange}
                            onWordDelete={this.deleteWord}
                            onWordSplit={this.splitWord}

                            onCloneTemplate={this.cloneTemplate.bind(this, activeTemplateId)}
                            onDeleteTemplate={this.onDeleteTemplate.bind(this, activeTemplateId)}
                            onTemplateNameChange={this.onTemplateNameChange}

                            blocksById={blocksById}
                            selectedBlock={selectedBlock}
                            blockPropertyChange={this.updateBlock}

                            timeline={this.templatesTimeline}
                            playing={playing}

                            onTemplateReady={this.syncAnimations}

                            fonts={fonts}
                            loadFont={this.loadFont.bind(this)}
                            loadFontList={this.loadFontList}

                            user={user}
                            clip={clip}

                            renderScaleOriginSelection={scaleSelectMode?<div onClick={this.onPointSelection} className='point-selector' />:<span />}
                            renderMedias={<MediaPreview

                                activeRatio={activeRatio}
                                onMediaChange={this.handleMediaChange}
                                medias={this.state.activeMediaIds}
                                mediasById={clip.config.mediasById}
                                selectedMediaId={selectedMediaId}
                                currentFrame={this.state.currentFrame}
                                setSelected={this.handleSelectMedia}
                                onMediaCanvasReady={mediaCanvas => this.setState({mediaCanvas})}
                            />}

                            //scaleSelectMode={scaleSelectMode}
                            showOverflow={showOverflow}
                        />
                    }

                </section>


                {
                    !this.isTabActive(SECTIONS.TEMPLATE) && !testMode &&
                    <Sidebar className='clip-sidebar'>

                        <div>

                            <FormGroup
                                label='Main Template'
                                intent={Intent.DANGER}
                                helperText={mainTemplate? '':'Please select a template'}>
                                {
                                    templates &&
                                    <Select

                                        className={'template-select'}
                                        items={templates}
                                        activeItem={mainTemplate}
                                        popoverProps={{position: Position.BOTTOM_RIGHT, usePortal: true}}

                                        itemListRenderer={renderTemplates}
                                        itemPredicate={filterAsset}
                                        itemRenderer={renderTemplate}

                                        onItemSelect={this.handleLayoutChange.bind(this)}>

                                        <Button
                                            intent={mainTemplate? null: Intent.DANGER}
                                            className="bp3-button bp3-icon-style line-height"
                                            rightIcon={'caret-down'}>
                                            {mainTemplate ? mainTemplate.name : 'Select a template'}
                                        </Button>
                                    </Select>
                                }
                            </FormGroup>

                            <FormGroup label='Clip Name'>
                                {/*<ControlGroup fill={true}>*/}
                                {/**/}
                                {/*<Popover*/}
                                {/*isOpen={showDetails}*/}
                                {/*autoFocus={false}*/}
                                {/*enforceFocus={false}*/}
                                {/*position={Position.BOTTOM}*/}
                                {/*content={ClipConfigMenu}>*/}
                                {/*<Button*/}
                                {/*fill={true}*/}
                                {/*intent={Intent.PRIMARY}*/}
                                {/*onClick={this.toggleDetails.bind(this)}*/}
                                {/*minimal={true}*/}
                                {/*icon="chevron-down" />*/}
                                {/*</Popover>*/}
                                {/*</ControlGroup>*/}
                                <InputGroup
                                    value={clip.name}
                                    onChange={this.updateName} />
                            </FormGroup>

                            <FormGroup label='Video Dimensions'>
                                <ButtonGroup fill={true}>
                                    {
                                        RATIO.ITEMS.map(ratio => <Button
                                            disabled={!this.isRatioAvailable(ratio)}
                                            key={ratio}
                                            text={RATIO.UI_LABELS[ratio]}
                                            onClick={this.setRatio.bind(this, ratio)}
                                            active={this.state.activeRatio === ratio} />)
                                    }
                                </ButtonGroup>
                            </FormGroup>

                            <Popover
                                position={Position.BOTTOM_RIGHT}
                                content={<div style={{width: '300px'}} className='padding'>
                                    {/*<FormGroup label='Show'>*/}
                                        {/*{*/}
                                            {/*feeds &&*/}
                                            {/*<Select*/}
                                                {/*noResults={<MenuItem disabled={true} text="No results." />}*/}
                                                {/*items={myFeeds}*/}
                                                {/*activeItem={show}*/}
                                                {/*popoverProps={{position: Position.RIGHT, minimal: true}}*/}
                                                {/*itemPredicate={filterGeneric}*/}
                                                {/*itemRenderer={renderGeneric}*/}
                                                {/*onItemSelect={this.showChange}>*/}

                                                {/*<Button*/}
                                                    {/*icon={CustomIcons.podcastIcon}*/}
                                                    {/*className="template-list"*/}
                                                    {/*rightIcon={'caret-down'}>*/}
                                                    {/*{show ? show.name : 'Not assigned (draft)'}*/}
                                                {/*</Button>*/}
                                            {/*</Select>*/}
                                        {/*}*/}
                                    {/*</FormGroup>*/}




                                    <ShareClipForm clipId={clip.id} />
                                </div>}
                            >
                                <Button className='margin-bottom' text={'Show Clip Details'} />
                            </Popover>



                            <H4>Medias</H4>

                            <Button
                                minimal={true}
                                className={'margin-bottom-10'}
                                intent={Intent.WARNING}
                                onClick={this.onInsertImage.bind(this)}
                                icon={'add'}
                                text={'Insert Image/GIF'} />

                            {/*<Tree*/}
                                {/*className={Classes.ELEVATION_0 + ' margin-bottom'}*/}
                                {/*contents={this.getTree()}*/}
                                {/*onNodeClick={media => this.selectMedia(media.id)}*/}
                            {/*/>*/}

                            {
                                sortedMedias.map(media => <article
                                    key={media.id}
                                    onClick={_ => this.selectMedia(media.id)}
                                    className={`bu-media ${media.selectedClass}`}>
                                    <figure className="bu-media-left">
                                        <p className="bu-image bu-is-32x32">
                                            <img src={media.imageUrl} />
                                        </p>
                                    </figure>
                                    <div className="bu-media-content">
                                        <div className="bu-content">
                                            <p>
                                                <small><strong>{media.label}</strong></small>
                                                <br />
                                                <small>{media.startTime}</small>
                                            </p>
                                        </div>
                                    </div>
                                </article>)
                            }

                            {
                                selectedMedia &&
                                <div className='margin-top'>
                                    <Button
                                        onClick={_ => this.cloneMedia(selectedMediaId)}
                                        icon={'duplicate'}
                                        className={'bp3-minimal'}
                                        intent={Intent.NONE}
                                        text={'Clone'}
                                    />
                                    <Button
                                        onClick={this.handleMediaDelete}
                                        icon={'trash'}
                                        className={'bp3-minimal'}
                                        intent={Intent.DANGER}
                                        text={'Delete'}
                                    />
                                </div>
                            }
                        </div>


                    </Sidebar>
                }

                {
                    !this.isTabActive(SECTIONS.TEMPLATE) && templateConfig && !selectedMediaId &&
                    <ClipTranscript
                        templates={templates}
                        selectedBlock={selectedBlock}
                        selectedWord={selectedWord}
                        selectedWordId={selectedWordId}
                        templateConfig={templateConfig}
                        fonts={fonts}
                        isMusic={isMusic}
                        activeRegion={activeRegion}
                        mainLayoutId={mainLayoutId}
                        wavesurfer={this.wavesurfer}
                        activeTab={activeTab}
                        playing={playing}
                        clip={clip}
                        loadFont={this.loadFont}
                        updateBlock={this.updateBlock}
                        onWordChange={this.wordChange}
                        onWordDelete={this.deleteWord}
                        onWordSplit={this.splitWord}
                        addBlockOrWord={this.addBlockOrWord}
                        toggleImportLyrics={this.toggleImportLyrics}
                        onWordSelect={this.selectWord}
                        onBlockSplit={this.splitBlock}
                        onBlockMerge={this.mergeBlock}
                        onToggleShiftBlock={this.toggleShiftBlock}
                        onBlockClone={this.cloneBlock}
                        onBlockDelete={this.deleteBlock}
                    />
                }

                {
                    showAssets &&
                    <AssetsManager
                        show={showAssets}
                        onInsert={this.insertImage.bind(this)}
                        section={AssetsManager.SECTIONS.CLIP}
                        onClose={this.toggleAssets}
                        feedId={clip.PodcastFeedId}
                        feeds={myFeeds}
                        selectedObject={selectedObject}
                    />
                }

                {
                    this.isTabActive(SECTIONS.CLIP) && selectedMediaId &&
                    <MediaControls
                        selectedMediaId={selectedMediaId}
                        mediasById={clip.config.mediasById}
                        onMediaChange={this.handleMediaChange}
                        onMediaDelete={this.handleMediaDelete}
                        dynamicArea={viewport}
                        mediaHelper={mediaCanvas && mediaCanvas.getObject('shallow')}
                        onMediaHelperChange={this.updateMediaHelper.bind(this)}
                        scaleObject={mediaCanvas && mediaCanvas.scaleObject.bind(mediaCanvas)}
                        execMethod={mediaCanvas && mediaCanvas.execMethod.bind(mediaCanvas)}
                        selectScaleOrigin={this.selectScaleOrigin}
                        scaleActive={scaleSelectMode}
                        syncAnimations={this.syncAnimations}
                        blockIds={blockIds}
                        blocksById={blocksById}
                        wordsById={wordsById}
                        toggleAssets={_ => this.toggleAssets(selectedMediaId, true) }
                    />
                }



                <ResizableBar
                    height={174}
                    minHeight={46}
                    //closed={this.isTabActive(SECTIONS.TEMPLATE)}
                    className={'clip-bottom-toolbar '}// + (this.isTabActive(SECTIONS.TEMPLATE)?'hide':'')}
                    handleClassName='clip-toolbar-handle'>

                    <Loading className={'opaque'} show={!this.wavesurfer} />

                    <H6 className='media-track'>Media Track</H6>
                    <H6 className='audio-track'>Audio Track</H6>

                    <section className='player-bar'>

                        <ButtonGroup  minimal={true} large={true}>
                            <Button icon='step-backward' onClick={() => this.wavesurfer.seekAndCenter(0)} />
                            <Button icon='fast-backward' onClick={() => this.wavesurfer.setCurrentTime(this.state.pos - 2)} />
                            {
                                playing ?
                                    <Button className={'button-large-no-margin'} onClick={this.togglePlay.bind(this)} ><Icon icon="pause" iconSize={20} /></Button> :
                                    <Button className={'button-large-no-margin'} onClick={this.togglePlay.bind(this)} ><Icon icon="play" iconSize={20} /></Button>
                            }
                            <Button icon='fast-forward' onClick={() => this.wavesurfer.setCurrentTime(this.state.pos + 2)} />
                        </ButtonGroup>

                        <TimeInput
                            onChange={this.handleTimeChange}
                            className='player-bar-time'
                            value={this.state.pos}
                            leftIcon={'time'}
                            rightElement={<Popover
                                onClose={e => this.closeInsertWordPopover()}
                                isOpen={this.state.insertWordOpen}
                                content={timelineActionsMenu}
                                position={Position.TOP}>
                                <Tooltip content={UI_TEXT.INSERT}>
                                    <Button
                                        onClick={e => this.setState({insertWordOpen: !this.state.insertWordOpen})}
                                        className={Classes.MINIMAL}
                                        icon='plus'
                                        intent={Intent.PRIMARY}
                                    />
                                </Tooltip>
                            </Popover>}
                        />

                        <FormGroup
                            className={'player-bar-speed'}
                            label={`Speed (${audioRate}x)`}
                            inline={true}
                        >
                            <ButtonGroup  minimal={true} large={true}>
                                <Button icon='minus' onClick={() => this.setAudioRate((audioRate*10 - 1) / 10)} />
                                <Button icon='plus' onClick={() => this.setAudioRate((audioRate*10 + 1) / 10)} />
                            </ButtonGroup>
                        </FormGroup>

                        <Button minimal={true} intent={Intent.PRIMARY} icon='updated' text={'Set Word Time'} onClick={this.setCurrentWordTime} />

                    </section>

                    <div className='audio-background' />

                    <div className="wavesurfer-container">


                        {
                            this.wavesurfer &&
                            <MediaTimeline
                                selectedMediaId={this.state.selectedMediaId}
                                onMediaSelected={this.selectMedia.bind(this)}
                                onMediaDurationChange={this.onMediaDurationChange.bind(this)}
                                onMediaStartTimeChange={this.onMediaStartTimeChange.bind(this)}
                                totalDuration={this.wavesurfer.getDuration()}
                                mediasById={clip.config.mediasById}
                                pictureTime={clip.config.globalSettings.pictureTime}
                            />
                        }

                        <Wavesurfer
                            className='wavesurfer-clip'
                            key={clip.id}
                            backend={'MediaElement'}
                            options={waveOptions}
                            timelineOptions={timelineOptions}
                            src={clip.audioUrl}
                            onReady={this.handleReady.bind(this)}
                            playing={playing}
                            regionPlaying={this.state.regionPlaying}
                            onPosChange={this.posChange.bind(this)}
                            regions={clip.config.wordsById}
                            onRegionIn={this.handleSingleRegionIn}
                            onRegionClick={this.handleSingleRegionClick.bind(this)}
                            selectedRegionId={activeRegion && activeRegion.id}
                            onRegionUpdateEnd={this.handleSingleRegionUpdate.bind(this)}
                            section={match.params.entityId}
                            //onRegionUpdated={this.handleSingleRegionUpdating.bind(this)}
                            onPlay={this.onPlay.bind(this)}
                            onFinish={this.onPlayed.bind(this)}
                            onPause={this.onPause.bind(this)}
                            audioRate={audioRate}
                            renderSelectedRegion={this.renderRegion.bind(this)}
                            renderCustomCursor={<div>
                                <div className='line' />
                                <Popover
                                    isOpen={this.state.insertMenu}
                                    onClose={e => this.setState({insertMenu: false})}
                                    content={timelineActionsMenu}
                                    position={Position.RIGHT}>
                                    <Button
                                        className='with-arrow cursor-button'
                                        rightIcon="plus"
                                        intent={Intent.PRIMARY}
                                        onClick={this.toggleInsertMenu.bind(this)}
                                    />
                                </Popover>
                            </div>}
                        >
                            <div className='wavesurfer-background'/>
                        </Wavesurfer>
                    </div>
                </ResizableBar>
            </div>
        )
    }
}

const PersistentComponent = withStorage(
    ClipEditor,
    'ClipEditor',
    ['activeRatio'],
    DEFAULT_STATE
)

export default connect(mapStateToProps)(ClipEditor);