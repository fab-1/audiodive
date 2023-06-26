import React, {Component, useState}  from 'react';
import {
    Button,
    Classes,
    Collapse,
    Dialog,
    FormGroup,
    Spinner,
    InputGroup,
    ControlGroup,
    Intent,
    Slider,
    Card,
    Popover,
    Tabs, Tab,
    MenuItem,
    Switch,
    Position,
    ButtonGroup, H4, H5, H2, H3, NumericInput, Menu
} from "@blueprintjs/core"
import { Prompt } from 'react-router';
import {Select} from "@blueprintjs/select"
import {filterEpisode, filterGeneric, renderGeneric, renderEpisode} from "../../shared/controls/custom-select"
import axios from "axios"
import FileDrop from 'react-file-drop'
import ReactPlayer from 'react-player'
import './clip-wizard.scss'
import Loading from './shared/loading'
import update from 'immutability-helper';
import _ from 'lodash'

import Validator from 'validator'
import CustomIcons from "../../shared/custom-icons"
import {connect} from "react-redux"
import {
    receiveTemplate, redoTemplate,
    resetTemplate, undoTemplate,
    updateGlobal,
    updateTemplate,
    updateLayoutConfig,
    updateLinkedElement
} from "../actions/template-actions"
import RATIO from "../../shared/video-ratio"
import ColorPicker from './template/color-picker'
import SHAPES from "./template/shapes"
import WizardImport from './wizard-import'
import Sticky from 'react-sticky-el';
import {
    deleteWord,
    fetchClip,
    mergeBlock, processClip, redoClip,
    resetClip, saveClip,
    splitBlock,
    splitWord, undoClip,
    updateBlock, updateClip,
    updateWord
} from "../actions/clip-actions"
import ClipBlock from './clip-editor/clip-block'

import NiceButton from '../components/shared/nice-button'

import ImageControls from './wizard/image-control'
import ProgressBarControls from './wizard/progress-bar-control'
import SpeakerControls from './wizard/speaker-control'
import TextControls from './wizard/text-control'
import VisControls from './wizard/vis-control'

class ClipWizard extends Component {

    constructor() {
        super()

        this.state = {
            show: null,
            canClose: true,
            selectedFile: null,
            currentStep: 1,
            loadingMessage: '',
            isOpen: false,
            message: 'Hey, you can edit this clip!',
            invitees: [],
            addFriend: true,
            canRecord: false,
            templates: [],
            copyTemplate: false,
            shows:[],
            activeRatio: RATIO.CONFIG_KEY.SQUARE,
            selectedStep: 'step0',
            multipleSpeakers: false,
            clonedTemplateName: 'My Template',
            selectedObject: null,
            saving: false,
            canEditTemplate: true
        }
    }

    componentDidMount(){

        let {clipId, userTemplates, libraryTemplates} = this.props


        let templates = [...userTemplates, ...libraryTemplates]
        //templates = templates.filter(template => template.id === )


        //this.props.dispatch(resetTemplate())
        //this.props.dispatch(resetClip())

        this.props.dispatch(resetTemplate())
        this.props.dispatch(resetClip())

        //this.loadFontList()

        if (!clipId) {
            //this.loadTemplates()
            return
        }


        console.log('LOADING')


        this.setState({
            loadingMessage: 'Loading...',
            templates
        })


        this.loadClipById(clipId)


        this.debounceSave = _.debounce(this.saveForm, 1000)
    }

    componentWillUnmount() {
        //window.removeEventListener('scroll', this.handleScroll)
        if (this.handler) {
            window.clearTimeout(this.handler)
        }
    }

    previewContainer = React.createRef()

    handleScroll = () => {
        this.lastScrollY = window.scrollY

        window.requestAnimationFrame(() => {
            const el = this.previewContainer.current
            const x = el.getBoundingClientRect().x

            if (x < this.lastScrollY)
                el.style.top = `${this.lastScrollY-x}px`
            else
                el.style.top = 0
        })
    }

    loadClipById(id) {
        // const pr = axios.get(`/admin/api/clip/${id}`)
        //
        // pr.then(res => {
        //     const clip = res.data
        //     this.setState({clip})
        // })

        return this.props.dispatch(fetchClip(id))
    }


    closeWizard() {
        //do some things

        this.props.history.push('/library')
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

        const {clip, template} = this.props
        const {templates} = this.state

        const clipId = this.props.clipId
        if (clipId !== prevProps.clipId) {
            if (clipId) {
                this.loadClipById(clipId)
            }
            else {

            }
        }

        if (clip && clip !== prevProps.clip) {

            this.checkClipStatus()

            if (templates || prevProps.clip && clip.PodcastFeedId !== prevProps.clip.PodcastFeedId) {

                if (clip.TemplateId && (!template || clip.TemplateId !== template.id)) {

                    this.props.dispatch(resetTemplate())
                    const selectedTemplate = templates.find(template => template.id === clip.TemplateId)

                    if (selectedTemplate) {
                        this.props.dispatch(receiveTemplate(selectedTemplate))
                    }
                    else {
                        //if the template is not in the list, user has no access
                        this.loadTemplateById(clip.TemplateId)
                    }
                }
            }
        }

        if (this.props.inviteStep !== prevProps.inviteStep) {
            this.checkClipStatus()
        }
    }

    //This is called when we access a clip whose template is not in the list of templates available for this user
    loadTemplateById(id) {
        axios.get('/admin/api/template/' + id).then(res => {
            const template = res.data

            this.props.dispatch(receiveTemplate(template))

            const {templates} = this.state

            const updatedTemplates = update(templates, {
                $push: [template]
            })

            this.setState({
                canEditTemplate: false,
                templates: updatedTemplates
            })
        })
    }


    checkLastStep() {

        this.props.inviteStep && this.setState({
            currentStep: 3
        })

        const {templates} = this.state
        if (!templates.length) {
            return
        }

        const selectedTemplate = templates.find(template => template.id === clip.TemplateId)
        this.props.dispatch(receiveTemplate(selectedTemplate))
    }

    selectEpisode(ep) {
        this.setState({show: ep})
    }

    selectTemplate(selectedTemplate) {
        this.props.dispatch(updateClip({TemplateId: selectedTemplate.id}))
        this.props.dispatch(receiveTemplate(selectedTemplate))
        //this.debounceSave()
    }

    loadFontList() {
        this.fontPromise = axios.get(`/admin/api/template/fonts`)
        this.fontPromise.then(res => this.setState({ fonts: res.data }))
    }

    onFontChange(elementId, v) {

        const {activeRatio} = this.state

        let updates = {fontFamily: v.value, fontVariants: v.variants}
        if (v.variants && v.variants.length === 1 && !isNaN(v.variants[0])) {
            updates.fontWeight = v.variants[0]
        }

        this.props.dispatch(updateLinkedElement(elementId, updates, activeRatio))

        this.playerRef.loadFont(updates)
    }

    updateLinkedElement(elementId, values) {
        const {activeRatio} = this.state
        this.props.dispatch(updateLinkedElement(elementId, values, activeRatio))
    }



    updateField(fieldName, e) {

    }

    onAudioClipUpload(event) {

    }


    updateGlobalObject(objectName, values) {
        const {activeRatio} = this.state
        this.props.dispatch(updateGlobal(objectName, values, activeRatio, this.props.viewMode))
    }

    timeoutValue = 5000

    checkClipStatus() {
        const {clip, template} = this.props
        let currentStep = 1



        try {
            // if (!clip) {
            //     return this.setState({
            //         loadingMessage: '',
            //         currentStep
            //     })
            // }
            //
            //
            // currentStep = 2

            this.setState({
                loadingMessage: '',
                currentStep
            })

            if (clip && clip.status !== 'ready') {
                this.handler = window.setTimeout(this.loadClipById.bind(this, clip.id), this.timeoutValue)

                //we increase timeout
                this.timeoutValue = this.timeoutValue + 1000
            }

            if (clip && clip.status === 'ready') {
                this.props.onWizardClose()
            }
        }

        catch(e) {
            console.error(e)
        }
    }


    handleReady(e) {
        console.log('ready')
        this.wavesurfer = e.wavesurfer
    }

    waveSurferRef(ref) {
        this.wavesurfer = ref.wavesurferInstance
        console.log( this.wavesurfer)
    }

    posChange(currentTime){

    }

    saveAndShare() {
        this.saveForm().
        then(res => this.props.history.push('/library/wizard/' + res.data.id + '/invite'))
    }

    saveAndEdit() {
        const {clip} = this.props
        this.props.openClip(clip.id)
        // this.saveForm().
        // then(res => this.props.openClip(res.data.clip.id))
    }

    process() {
        const {activeRatio, templates} = this.state
        let {clip, dispatch} = this.props

        this.saveForm().
        then(res => {
            dispatch(processClip(clip.id, {ratio: RATIO.PARAM_KEYS[activeRatio]}))
        }).
        then(e => {
        }).
        catch(e => console.error(e))

        window.setTimeout(this.loadClipById.bind(this, clip.id), 5000)
    }

    saveForm() {

        let {templates} = this.state
        let {clip} = this.props
        const {template} = this.props

        const data = {
            ...clip,
            template
        }

        this.setState({saving: true})

        const pr = axios.put(`/admin/api/clip/${clip.id}`, data)
        pr.then(res => {
            const created = res.data.template
            this.setState({saving: false})

            if (template.PodcastFeedId === 1) {
                this.props.dispatch(updateClip({TemplateId: created.id}))
            }

            if (template.id === 'clone') {

                const index = templates.findIndex(tpl => tpl.id === 'clone')
                const updatedTemplates = update(templates, {
                    $push: [created]
                })

                this.props.updateTemplates(updatedTemplates)

                this.props.dispatch(receiveTemplate(created))
                this.props.dispatch(updateClip({TemplateId: created.id}))
            }
        })

        return pr
    }

    handleImageUpload(type, event) {

        const {feedId} = this.state

        let formData = new FormData()

        formData.append("section", 'template')
        formData.append('showId', feedId? feedId:'')
        formData.append("imageData", event.target.files[0])

        axios.post(`/admin/api/asset/upload`, formData).
        then(res => {
            const asset = res.data

            switch (type) {
                case 'background':
                    this.playerRef.setBackground(asset)
                    break

                default:
                    this.playerRef.setImage(asset, type)
            }
        })
    }

    selectObject(selectedObject){
        this.setState({
            selectedObject
        })

        this.playerRef.selectObject(selectedObject.id)
    }

    selectObjectFromCanvas = (id) => {

        console.log(id)
        // const {template} = this.props
        // const {activeRatio} = this.state
        //
        // let layoutConfig = template[activeRatio]
        //
        // const selectedObject = layoutConfig.canvas.objects.find(object => object.id === id)
        //
        // this.setState({
        //     selectedObject
        // })
    }

    onDrop(type, files) {
        console.log(files)
        const selectedFile = files[0]
        this.handleImageUpload(type, {
            target: {files}
        })
    }


    sendInvite = () => {
        const {invitees, message, addFriend, clip} = this.state

        this.setState({
            loadingMessage: 'Sending Invites...'
        })

        axios.post(`/admin/api/clip/invite/${clip.id}`, {
            invitees,
            message,
            addFriend
        }).
        then(res => {
            this.setState({
                loadingMessage: ''
            })
            this.props.history.push(`/clip/${clip.id}`)
        })
    }


    getElements(){

        const {template} = this.props
        const {activeRatio} = this.state

        if (!template) {
            return []
        }

        let layoutConfig = template[activeRatio]

        if (!layoutConfig) {
            return []
        }

        const elements = layoutConfig.linkedElements

        const objects = layoutConfig.canvas.objects.map((object, index, original) => {

            //we need to find the correct zIndex, however dynamic media should always be after text in editor

            const linkedElement = elements[object.id]
            return {
                ...linkedElement,
                id: object.id,
                key: object.id,
                name: object.name,
                type: object.type,
                top: object.top,
                left: object.left,
                width: Math.round(object.width * object.scaleX),
                height: Math.round(object.height * object.scaleY),
                angle: object.angle,
                src: linkedElement.src || object.src,
                zIndex: index + 1
            }
        })

        return objects
    }

    handleTabChange = (tab) => {
        this.setState({selectedStep: tab})
    }

    cloneTemplate = () => {

        //const {clonedTemplateName} = this.state
        const {configSquare, configWide, configVertical, name} = this.props.template

        const clone = {
            id: 'clone',
            name: 'Clone of ' + name,
            configSquare,
            configVertical,
            configWide,
            UserTemplates: []
        }

        const templates = [...this.state.templates, clone];
        //const selectedTemplateId = 'clone'
        //openedTemplateIds.push(selectedTemplateId)

        this.setState({
            templates,
            showClonePopover: false
        })

        this.props.dispatch(resetTemplate())

        this.selectTemplate(clone)
    }



    ButtonsGroup = (props) => {

        const {label, options, property, value, updateLinkedElement, element, className} = props

        const buttons = options.map(option => {
            return (<Button
                active={option.value === value}
                key={option.value}
                onClick={e => updateLinkedElement(element.id, {[property]: option.value})}>
                {option.text || option.value}
            </Button>)
        })

        return (<FormGroup className={className} label={label}>
            <ButtonGroup>
                {
                    buttons
                }
            </ButtonGroup>
        </FormGroup>)
    }

    splitBlock = (blockId, wordIndexInBlock) => {
        this.props.dispatch(splitBlock(blockId, wordIndexInBlock))
    }

    addBlock = () => {
        this.props.dispatch(splitBlock(blockId, wordIndexInBlock))
    }

    mergeBlock = (blockId) => {
        this.props.dispatch(mergeBlock(blockId))
    }

    wordChange = (wordId, propertyName, value) => {
        this.props.dispatch(updateWord(wordId, {
            [propertyName]: value
        }))
    }

    undo() {
        if (this.isTabActive(SECTIONS.TEMPLATE)) {
            this.props.dispatch(undoTemplate())
        }

        if (this.isTabActive(SECTIONS.CLIP || SECTIONS.TRANSCRIPT)) {
            this.props.dispatch(undoClip())
        }
    }

    undoClip = () => {
        this.props.dispatch(undoClip())
    }

    redo() {

        if (this.isTabActive(SECTIONS.TEMPLATE)) {
            this.props.dispatch(redoTemplate())
        }

        if (this.isTabActive(SECTIONS.CLIP || SECTIONS.TRANSCRIPT)) {
            this.props.dispatch(redoClip())
        }
    }

    selectWord = (wordId, seek) => {
        const {wordsById, blockIds, blocksById} = this.props.clip.config

        const word = wordsById[wordId]
        const blockIndex = blockIds.indexOf(word.blockId)
        const block = blocksById[word.blockId]

        this.setState({
            selectedBlockIndex: blockIndex,
            selectedWordId: wordId
        })

        if (this.playerRef && seek) {
            this.playerRef.updateTextForTime(word.start + 0.05)
            this.playerRef.playerRef.seekTo(word.start + 0.05, 'seconds')
        }

    }

    unselectRegion(cb) {

        this.setState({
            selectedWordId: null
        }, () => cb && cb())
    }

    deleteWord = (wordId) => {
        this.unselectRegion(() => this.props.dispatch(deleteWord(wordId)))
    }

    splitWord = (wordId) => {
        //this.unselectRegion(() => this.props.dispatch(splitWord(wordId)))
        this.props.dispatch(splitWord(wordId))
    }

    updateBlock = (blockId, values) => {
        this.props.dispatch(updateBlock(blockId, values))
    }

    setRatio = (activeRatio) => {
        this.setState({activeRatio})
    }

    isRatioAvailable(ratio){

        const {template} = this.props


        return template && template[ratio] && template[ratio].canvas && template[ratio].canvas.objects.length > 1
    }

    getRaw() {
        const {clip} = this.props

        //clips.config.
    }

    render() {

        const {history, feedsById, shows, template, clip, templateHistory, clipHistory, userPlan, openClip, showMenu, clipId} = this.props
        const {playing, saving, templates,
            currentStep, loadingMessage, selectedFeed, invitees,
            activeRatio, fonts, canRecord, clonedTemplateName,
            selectedStep, showClonePopover, jsonFeed, selectedWordId, selectedObject} = this.state

        let selectedTemplate = template

        // if (clip && clip.TemplateId && template) {
        //     const templateInList = templates.find(template => template.id === clip.TemplateId)
        //     console.log('inlist', templateInList)
        //     if (!templateInList) {
        //         //adding on the fly
        //         templates.unshift(template)
        //         console.log(templates)
        //     }
        // }

        const templateConfig = selectedTemplate && selectedTemplate[activeRatio]



        const activeWordId = selectedWordId //|| clip && clip.config && clip.config.wordIds[0]


        //const feedId = feedsById && clip && clip.PodcastFeedId
        const show = selectedFeed //selectedFeed?feedsById[selectedFeed.id]:null

        const isTemplateOwner = selectedTemplate && selectedTemplate.UserTemplates && selectedTemplate.UserTemplates.length

        const isReadyOnly = selectedTemplate && selectedTemplate.id !== 'clone' && (selectedTemplate.PodcastFeedId === 1)
        const copyTemplate = isReadyOnly?true:this.state.copyTemplate

        const canSave = !isReadyOnly
        const isSaved = template && template.id !== 'clone'

        const elements = this.getElements()
        const titleElement = elements.find(element => element.name.trim() === 'title')
        const bgElement = elements.find(element => element.name.trim() === 'background')
        const logo = elements.find(element => element.name.trim() === 'logo')
        const textArea = elements.find(element => element.id === 'textArea')
        const visArea = elements.find(element => element.name.trim() === 'visualization')
        const progress = elements.find(element => element.name.trim() === 'progress')
        const speaker1Image = elements.find(element => element.name.trim() === 'speaker1_picture')
        const speaker1Text = elements.find(element => element.name.trim() === 'speaker1_text')
        const speaker2Image = elements.find(element => element.name.trim() === 'speaker2_picture')
        const speaker2Text = elements.find(element => element.name.trim() === 'speaker2_text')

        const execMethod = this.playerRef && this.playerRef.execMethod.bind(this.playerRef)


        const viewport = RATIO.DIMENSIONS[activeRatio]

        const width = Math.min(420, document.body.clientWidth)
        const height = viewport.height * width / viewport.width

        const maxWidth = width + 'px'
        const maxHeight = height + 'px'

        let canUndoTemplate =  templateHistory.past.length
        let canUndoClip =  clipHistory.past.length

        if (!this.props.showWizard) return <span />

        const menuOpen = showMenu?{
            paddingLeft:'258px'
        }:{}

        const invalidTemplate = !selectedTemplate || selectedTemplate.id === 'clone'

        const processing = clip && clip.status === 'processing'
        const transcripting = clip && clip.status === 'transcribing'
        const cutting = clip && clip.status === 'cutting'
        const canEditClip = clip && clip.UserClips.length > 0
        const canEditTemplate = template && template.UserTemplates.length > 0

        return <React.Fragment>


            {/*{*/}
                {/*clip && canEditClip &&*/}
                {/*<Navbar style={menuOpen} fixed='bottom'>*/}
                    {/*<div className='navbar-item margin-auto buttons is-centered'>*/}

                        {/*<NiceButton*/}
                            {/*disabled={!canUndoTemplate}*/}
                            {/*onClick={e => {*/}
                                {/*this.props.dispatch(undoTemplate())*/}
                                {/*setTimeout(this.playerRef.renderAll, 5)*/}
                            {/*}}*/}
                            {/*intent={Intent.PRIMARY}*/}
                            {/*title={'Undo Last Change'}*/}
                            {/*minimal={true}*/}
                            {/*icon="undo"*/}
                            {/*text={'Undo Last Change'}*/}
                        {/*/>*/}

                        {/*<NiceButton*/}
                            {/*disabled={!selectedTemplate}*/}
                            {/*intent={'link'}*/}
                            {/*text='Save'*/}
                            {/*loading={saving}*/}
                            {/*onClick={this.saveForm.bind(this)}*/}
                        {/*/>*/}
                        {/**/}
                        {/*{*/}
                            {/*<NiceButton*/}
                                {/*disabled={!selectedTemplate || !canSave || !isSaved}*/}
                                {/*intent={'link'}*/}
                                {/*icon={'film'}*/}
                                {/*text='Edit and Export Clip'*/}
                                {/*onClick={this.saveAndEdit.bind(this)}*/}
                            {/*/>*/}
                        {/*}*/}
                        {/**/}
                    {/*</div>*/}
                {/*</Navbar>*/}
            {/*}*/}

            <div className='clip-wizard'>

                {
                    !clip &&  <H3 className='is-hidden-mobile title'>Import Clip</H3>
                }

                {
                    clip && <H3 className='is-hidden-mobile title'>
                        <span className='has-text-grey'>{canEditClip?'My Clips':'Sample Clips'} / </span>
                        <span>{clip.name}</span>
                    </H3>
                }

                    {/*<ul className="list-unstyled multi-steps">*/}
                        {/*<li className={currentStep === 1?'is-active':''}>Select Audio</li>*/}
                        {/*<li className={currentStep === 2?'is-active':''}>Choose a Template</li>*/}
                        {/*<li className={currentStep === 3?'is-active':''}>Customize More</li>*/}
                    {/*</ul>*/}


                {
                    !clip &&
                    <WizardImport
                        hide={loadingMessage}
                        closeWizard={this.closeWizard.bind(this)}
                        userPlan={userPlan}
                        shows={shows}
                        history={history}
                        menuOpen={menuOpen}
                        setMessage={loadingMessage => this.setState({loadingMessage})}
                    />
                }

                {
                    (loadingMessage || cutting || (clip && !clip.audioUrl)) &&
                    <Card elevation={0} className='bp3-text-large'>
                        <Spinner intent={Intent.PRIMARY} size={30} />
                        <div className='loading-message'>
                            {loadingMessage}
                            {cutting && 'Initializing Clip...'}
                        </div>
                    </Card>
                }

                </div>
        </React.Fragment>
    }
}

ClipWizard.propTypes = {};

const mapStateToProps = (state, props) => {

    let ret = {
        template: state.template.present,
        clip: state.clip.present,
        clipHistory: state.clip,
        templateHistory: state.template
    }

    return ret
}

export default  connect(mapStateToProps, null, null, { forwardRef: true })(ClipWizard)