import {
    fetchTemplate,
    saveTemplate,importTemplate,
    updateGlobal,
    updateLayoutConfig, updateLinkedElement,
    updateTemplate, receiveTemplate,
    createTemplate, resetTemplate, undoTemplate, redoTemplate
} from '../../actions/template-actions'
import { ActionCreators } from 'redux-undo';

import Panel from '../clip-editor/panel.jsx'
import React from 'react'
import axios from "axios/index"
import debounce from 'lodash/debounce'
import { Rnd } from "react-rnd";
import Draggable from 'react-draggable';

import CustomIcons from '../../../shared/custom-icons'
import ReactFabric from './react-fabric'
import TextControls from './text-controls.js'
import StaticText from './static-text-preview'

import TextPreview from './text-preview.jsx'
import VisPreview from './vis-preview.jsx'
import VisControls from './vis-controls.jsx'
import ParticlesControl from './particles-controls.jsx'
import BlockControls from './block-controls.js'
import TemplateControls from './template-controls.jsx'
import Accordion from '../shared/accordion'
import Sidebar from '../shared/sidebar'
import ElementControls from './element-controls'
import WebFont from 'webfontloader'


import UI_TEXT from '../../ui-text'
import {
    NavbarDivider,
    Navbar,
    InputGroup,
    Alert,
    Position,
    Button,
    ButtonGroup,
    NumericInput,
    Switch,
    Intent,
    TextArea,
    Spinner,
    Tooltip, ControlGroup,
    FormGroup,
    Slider, Menu, MenuItem, Popover
} from "@blueprintjs/core"
import {Select} from '@blueprintjs/select'

import PreviewProgress from '../../../react-preview/preview-progress'

import {Utils} from "../../../shared/utils"
import {connect} from "react-redux"
import SHAPES from './shapes'
import ColorPicker from './color-picker'
import {filterGeneric, renderGeneric} from "../../../shared/controls/custom-select"
import RATIO from '../../../shared/video-ratio'
import TemplateRenderer from "./template-renderer"

const TABS = {
    GLOBAL: 'global',
    WORD: 'word',
    BLOCK: 'block'
}

const SAMPLE_STRING = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'.split(' ')
const SAMPLE_WORDS = () => {
    let ret = {}

    SAMPLE_STRING.forEach(w => {
        ret[w] = {word: w, id: w}
    })

    return {
        BY_ID: ret,
        WORDS: SAMPLE_STRING
    }
}

class ClipLayout extends React.Component {

    constructor() {

        super()

        this.state = {
            selectedObjectId: null,
            showText: true,
            currentImage: null,
            textTab: TABS.GLOBAL,
            activeRatio: RATIO.CONFIG_KEY.SQUARE,
            specialKey: false,
            canvasData: null,
            layout: null
        }

        //this.updateCanvasObject = debounce(this.updateCanvasObject, 100)


    }

    componentDidCatch(error, info) {
        console.error(error)
    }

    componentDidMount() {

        this.loadForm(this.props.id)

        this.saveFormAction = this.saveForm.bind(this);

        window.addEventListener('resize', this.setWindowHeight.bind(this))
        this.setWindowHeight()

        window.addEventListener('keyup', event => {
            if (this.state.specialKey) {
                this.setState({specialKey: false})
                this.forceUpdate()
                event.preventDefault()
            }
        })

        window.addEventListener('keydown', event => {
            const special = event.altKey || event.ctrlKey
            if (special && !this.state.specialKey) {
                this.setState({specialKey: true})
                this.forceUpdate()
            }
        })
    }


    onPointSelection(e){

        const {activeRatio, specialKey, selectScaleOriginId, selectScaleTransitionType} = this.state

        const layoutConfig = this.props.template[activeRatio]
        if (!layoutConfig) return

        const scale = this.state.viewportScale
        const box = e.currentTarget.getBoundingClientRect()
        const x = Math.round(e.clientX/scale - box.left/scale)
        const y = Math.round(e.clientY/scale - box.top/scale)

        if (specialKey) {
            this.updateGlobalObject('showTransition', {
                originX: x,
                originY: y
            })
        }

        if (selectScaleOriginId) {

            this.updateLinkedElement(selectScaleOriginId, {
                [selectScaleTransitionType] : {
                    originX: x,
                    originY: y
                }
            })

            this.setState({
                selectScaleOriginId: '',
                selectScaleTransitionType: '',
                specialKey: ''
            })
        }
    }

    getScaleTransitionBox() {
        const {activeRatio, specialKey, selectScaleOriginId, selectScaleTransitionType} = this.state

        const layoutConfig = this.props.template[activeRatio]
        if (!layoutConfig) return

        if (selectScaleOriginId) {

            const {originX, originY, scale} = layoutConfig.linkedElements[selectScaleOriginId][selectScaleTransitionType]

            const viewport = RATIO.DIMENSIONS[activeRatio]

            const size = {
                width: Math.round(viewport.width / scale),
                height: Math.round(viewport.height / scale),
            }

            const position = {
                x: originX - Math.round(size.width/2),
                y: originY - Math.round(size.height/2),
            }

            return {
                size,
                position
            }
        }

        return {

        }
    }

    scaleDragStop = (e, d) => {
        this.setState({ x: d.x, y: d.y })

    }


    selectTemplateScaleOrigin() {
        this.setState({specialKey: !this.state.specialKey})
    }

    selectScaleOrigin(id, selectScaleTransitionType) {
        let {selectScaleOriginId} = this.state
        selectScaleOriginId = selectScaleOriginId === id? '':id
        this.setState({selectScaleOriginId, selectScaleTransitionType})
    }

    componentDidUpdate(prevProps, prevState) {

        const {id, selectedWordId, viewMode, template, ratio, onTemplateReady} = this.props

        const ratioChanged = prevProps.ratio !== ratio
        const templateChanged = prevProps.template !== template
        const modeChanged = prevProps.viewMode !== viewMode

        if (selectedWordId !== prevProps.selectedWordId &&
            this.state.textTab !== TABS.WORD && selectedWordId) {
            this.setState({textTab: TABS.WORD})
        }

        if (viewMode && viewMode !== prevProps.viewMode) {

            const {activeRatio} = this.state

            const {canvas} = template[activeRatio]

            this.setState({
                selectedObjectId: null,
                fabricConfig: canvas
            })
        }

        if (ratioChanged) {
            console.log('ratioChanged')
            // this.setState({
            //     activeRatio: ratio
            // })
        }

        if (prevProps.id !== id) {
            console.log('Layout changed', id)
            this.loadForm(id)
        }

        if (ratioChanged) {
            this.openTemplate(template, ratio)
        }

        if (ratioChanged || modeChanged || prevProps.id !== id) {
            console.log('init transition', templateChanged)
            //this.initTransitions()

            onTemplateReady && onTemplateReady(template)
        }
    }


    saveForm() {

        this.props.dispatch(
            saveTemplate()
        ).then(res => {
            this.props.onSaved(res.data.record)

            this.refreshCanvas()
        })

        //this.props.dispatch(ActionCreators.clearHistory())
    }

    cloneTemplate = () => {
        const {template} = this.props

        axios.post(`/admin/api/template/${template.id}`).
        then(res => {
            this.props.onTemplateCloned(res.data.id)
        })
    }

    refreshCanvas() {
        const {activeRatio} = this.state
        const { template } = this.props

        const canvas = template[activeRatio].canvas

        this.setState({fabricConfig: canvas})
    }

    loadForm(id) {

        let {activeRatio} = this.state

        const {ratio, scheduledLayoutByBlockId, viewMode, templatesById} = this.props

        this.props.dispatch(ActionCreators.clearHistory())

        if (ratio) {
            activeRatio = ratio
        }

        console.log('loading template', id)

        if (id === null) {
            this.props.dispatch(resetTemplate(viewMode))
            return
        }

        //clear old styles - prob a cleaner way to do this
        const templateElement = document.getElementById('template-camera')
        if (templateElement) {
            templateElement.style.opacity = 1
        }

        const template = templatesById[id]

        if (id === 'create' || id === 'new') {

            const blankTemplate = createTemplate(template)
            this.props.dispatch(receiveTemplate(blankTemplate, viewMode))

            const config = blankTemplate[activeRatio]
            this.setState({fabricConfig: config.canvas})
            return
        }

        if (id === 'clone') {

            this.props.dispatch(receiveTemplate(template, viewMode))

            const config = template[activeRatio]
            this.setState({fabricConfig: config.canvas})
            return
        }

        if (template) {
            this.props.dispatch(receiveTemplate(template))

            this.openTemplate(template, activeRatio)
        }

    }

    openTemplate = (template, activeRatio) => {
        let config = template[activeRatio]

        for (let key in config.linkedElements) {
            const element = config.linkedElements[key]
            element.fontFamily && this.props.loadFont(element)
        }

        this.setState({
            fabricConfig: config.canvas,
            activeRatio: activeRatio
        })
    }

    importFromRatio = (ratio) => {

        const {activeRatio} = this.state
        const {template} = this.props

        this.props.dispatch(importTemplate(template, ratio, activeRatio))

        setTimeout(_ => this.refreshCanvas(), 100)

    }

    handleSelectedObject(objectId) {
        this.setState({
            selectedObjectId: objectId
        })
    }

    onCanvasReady(canvas) {

        console.log('oncanvasready')
        this.canvasRef = canvas

        this.forceUpdate()
    }

    onCanvasDestroyed() {

        console.log('oncanvasdestroy')

        this.canvasRef = null;
    }

    discardSelection() {
        this.canvasRef.discardSelection()
        this.setState({
            selectedObjectId: null
        })
    }

    selectObject(id) {
        this.canvasRef.selectObject(id)
        this.setState({
            selectedObjectId: id
        })
    }

    removeObject(id) {
        this.canvasRef.deleteObject(id)
    }

    execMethod(id, method) {
        this.canvasRef.execMethod(id, method)
    }

    updateCanvasObject(id, property, value) {
        this.canvasRef.updateObject(id, property, value)
    }

    onFabricUpdate(config, removed) {
        const {activeRatio} = this.state

        // if (removedId && !this.canvasRef.getObject(removedId)) {
        //     updates[removedId] = undefined
        // }

        if (!this.props.viewMode) {
            this.props.dispatch(updateLayoutConfig(config, activeRatio, removed, this.props.viewMode))
        }
    }

    layoutChange(prop, val) {
        this.props.dispatch(updateTemplate(prop, val, this.props.viewMode))
    }

    updateGlobalObject(objectName, values) {
        const {activeRatio} = this.state
        this.props.dispatch(updateGlobal(objectName, values, activeRatio, this.props.viewMode))
    }

    updateLinkedElement(objectName, values) {
        const {activeRatio} = this.state
        const { template, fonts } = this.props

        for (let key in values) {
            if (key === 'backgroundColor') {
                //console.log(objectName, values[key]);
                //this.updateCanvasObject(objectName, 'fill', values[key])
            }

            if (key === 'fontWeight') {
                const textObject = template[activeRatio].linkedElements[objectName]
                this.props.loadFont(Object.assign({}, textObject, {fontWeight: values[key]}))
            }
        }

        this.props.dispatch(updateLinkedElement(objectName, values, activeRatio, this.props.viewMode))
    }

    fontChange(event) {
        let formData = new FormData();

        formData.append("section", 'font');
        formData.append("imageData", event.target.files[0]);

        axios.post(`/admin/api/asset/upload`, formData).
        then(res => {
           this.props.loadFontList()
        })
    }

    isTabActive(tab) {
        return this.state.textTab === tab
    }

    addShape(type){

        let newShape = null

        switch (type) {
            case SHAPES.TEXT:
                newShape = this.canvasRef.addTextArea()
                break

            case SHAPES.DYNAMIC:
                newShape = this.canvasRef.addDynamicArea()
                break

            case SHAPES.VISUALIZATION:
                newShape = this.canvasRef.addVisArea()
                break

            case SHAPES.HTML_TEXT:
                newShape = this.canvasRef.addHtmlText()
                break

            case SHAPES.PROGRESS:
                newShape = this.canvasRef.addProgress()
                break

            case SHAPES.PARTICLES:
                newShape = this.canvasRef.addParticles()
                break
        }

        this.selectObject(newShape.id)
    }

    undo() {
        this.props.dispatch(undoTemplate())

        setTimeout(()=> {
            this.props.template[this.state.activeRatio].canvas.objects.forEach(object => {
                const obj = this.canvasRef.getObject(object.id)
                obj.set(object)
            })
            this.canvasRef.renderAll()
        }, 5)
    }

    redo() {

        this.props.dispatch(redoTemplate())

        setTimeout(()=> {
            this.props.template[this.state.activeRatio].canvas.objects.forEach(object => {
                const obj = this.canvasRef.getObject(object.id)
                obj.set(object)
            })
            this.canvasRef.renderAll()
        }, 5)
    }

    insertImage(image, selectedObject) {

        if (selectedObject && selectedObject.type === 'htmlText') {
            this.updateLinkedElement(selectedObject.id, {
                backgroundImage: image.url
            })
            return
        }

        if (selectedObject) {
            //this.canvasRef.execMethod(selectedObject.id, 'setSrc', image.url, () => {}, image)
            this.updateLinkedElement(selectedObject.id, {
                imgSrc: image.url
            })
        }
        else {
            const newImage = this.canvasRef.addImage2(image.url,  image)
            this.updateLinkedElement(newImage.id, {
                imgSrc: image.url
            })
        }

    }

    insertBackground(image) {
        this.updateGlobalObject('backgroundImage', image.url)
    }


    toggleConfig() {
        this.setState({showConfig: !this.state.showConfig})
    }

    getElements(){

        const {template} = this.props
        const {activeRatio} = this.state
        let layoutConfig = template[activeRatio]

        const elements = layoutConfig.linkedElements || layoutConfig
        //const {dynamicArea, textArea, visArea} = elements

        return layoutConfig.canvas.objects.map((object, index, original) => {

            //we need to find the correct zIndex, however dynamic media should always be after text in editor

            return {
                ...elements[object.id],
                id: object.id,
                type: object.type,
                top: object.top,
                left: object.left,
                width: Math.round(object.width * object.scaleX),
                height: Math.round(object.height * object.scaleY),
                angle: object.angle,
                src: object.src,
                zIndex: index
            }
        })
    }

    setWindowHeight() {
        this.setState({windowHeight: window.innerHeight})
    }

    bookmark() {
        const {template} = this.props
        axios.get(`/admin/api/template/${template.id}/bookmark`).then(res => {

        })
    }

    toggleDelete = () => {
        this.setState({deleteWarning: !this.state.deleteWarning})
    }

    switchRatio = (activeRatio) => {

        const {template, switchRatio} = this.props

        let config = template[activeRatio]

        this.setState({
            fabricConfig: config.canvas,
            activeRatio
        })

        switchRatio(activeRatio)
    }

    toggleVisualizer(id, linkedElement) {

        const visualization = linkedElement.visualization?undefined:{
            property: 'scale',
            frequencyBin: 0,
            amplitude: 0.3
        }

        this.updateLinkedElement(id, {visualization})
    }

    updateVisualizerConfig(id, linkedElement, property, value) {
        const visualization = Object.assign({}, linkedElement.visualization, {
            [property]: value
        })

        this.updateLinkedElement(id, {visualization})
    }

    templateNameChange = (event) => {
        const {template} = this.props
        this.layoutChange('name', event.target.value)
        this.props.onTemplateNameChange(template.id, event.target.value)
    }

    render() {

        const {
            selectedBlock,
            viewMode,
            template, isMusic, clip,
            toggleAssets, blocksById, playing, viewportScale,
            selectedMediaId,
            renderMedias, feedsById
        } = this.props


        const {activeRatio, selectedObjectId, showConfig, windowHeight, specialKey, selectScaleOriginId} = this.state

        const scaleSelectMode = selectScaleOriginId || specialKey || this.props.scaleSelectMode
        const scaleBox = scaleSelectMode? this.getScaleTransitionBox() : {}

        const showOverflow = this.props.showOverflow

        const getHtmlTextContent = (object) => {

            if (!viewMode) return object.content

            if (object.content) {
                return object.content.replace('{clipName}', clip && clip.name)
            }

        }

        if (!template) {
            return <span />
        }

        const {loading, touched} = template

        let layoutConfig = template[activeRatio]

        const objects = this.getElements()

        const dynamicArea = objects.find(elem => elem.id === 'dynamicArea')
        const textArea = objects.find(elem => elem.id === 'textArea')
        const visArea = objects.find(elem => elem.id === 'visArea')
        const area = objects.find(elem => elem.id === 'particles')

        const containerBound = RATIO.DIMENSIONS[activeRatio]
        const {width, height} = containerBound

        let allWordsById = this.props.allWordsById || SAMPLE_WORDS().BY_ID
        let currentWords = selectedBlock?selectedBlock.wordIds:[]

        let selectedWordId = this.props.selectedWordId
        const selectedWord = allWordsById[selectedWordId]

        const viewport = RATIO.DIMENSIONS[activeRatio]



        const viewPortStyle = {
            transform: `scale(${viewportScale})`,
            //cursor: scaleSelectMode?'crosshair':null,
            width: `${viewport.width}px`,
            height: `${viewport.height}px`,
            overflow: showOverflow? 'visible':'hidden'
        }

        const {backgroundColor, backgroundImage} = layoutConfig

        const cameraStyle = {
            backgroundColor: backgroundColor || '#FFF',
            backgroundImage: backgroundImage && `url(${backgroundImage})`,
            backgroundSize: 'contain'
        }

        const selectedObject = selectedObjectId && this.canvasRef && this.canvasRef.getObject(selectedObjectId)

        const selectedLinkedObject = selectedObject && objects.find(obj => obj.id === selectedObjectId)
        const isInvalid = !template.PodcastFeedId || !template.name

        const feed = template.PodcastFeedId && feedsById && feedsById[template.PodcastFeedId]

        const maxHeight = (viewportScale*viewport.height) + 40 //size of slider

        const isNew = template.id === 'new' || template.id === 'clone'

        const readOnly = !template.UserTemplates || !template.UserTemplates.length



// style={{maxHeight: `${maxHeight}px`}}
        return (
            <div className={`template-editor ${viewMode? 'view-mode':'edit-mode'}`}>


                <Alert
                    intent={Intent.DANGER}
                    icon="trash"
                    isOpen={this.state.deleteWarning}
                    onConfirm={_ => { this.toggleDelete(); this.props.onDeleteTemplate() }}
                    onCancel={this.toggleDelete}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete">
                    <p>Would you like to delete the template <strong>{template.name}</strong>?</p>
                </Alert>

                {
                    (this.props.renderNav) &&
                    <Navbar className='navbar-mini'>
                        {this.props.renderNav}

                        {/*{*/}
                            {/*loading?<Spinner size={20} />:<Button*/}
                                {/*onClick={this.saveForm.bind(this)}*/}
                                {/*disabled={!touched || isInvalid}*/}
                                {/*className={Classes.MINIMAL + ' ' + Classes.INTENT_PRIMARY}*/}
                                {/*icon="floppy-disk" />*/}
                        {/*}*/}

                        {/*<NavbarDivider/>*/}

                        <ButtonGroup minimal={true}>
                            <Tooltip content={UI_TEXT.UNDO}>
                                <Button
                                    disabled={this.props.past.length === 0}
                                    onClick={this.undo.bind(this)}
                                    icon="undo" />
                            </Tooltip>

                            <Tooltip content={UI_TEXT.REDO}>
                                <Button
                                    disabled={!this.props.future.length}
                                    onClick={this.redo.bind(this)}
                                    icon="redo" />
                            </Tooltip>
                        </ButtonGroup>
                    </Navbar>
                }


                {
                    template && <div className='viewport-wrapper' >



                        {/*{*/}
                            {/*ReactDOM.createPortal(*/}
                                {/*this.props.children,*/}
                                {/*this.el,*/}
                            {/*)*/}
                        {/*}*/}

                        <div className={'clip-viewport'} style={viewPortStyle}>
                            <section
                                id={'template-camera'}
                                className={`camera ${activeRatio} ${selectedMediaId?'media-selected':''}`}
                                style={cameraStyle}>

                                {
                                    !viewMode &&
                                    <ReactFabric
                                        key={activeRatio + template.id}
                                        width={width}
                                        height={height}
                                        readOnly={viewMode}
                                        canvasId={'canvas-layout'}
                                        defaultData={this.state.fabricConfig}
                                        onCanvasReady={this.onCanvasReady.bind(this)}
                                        onFabricChange={this.onFabricUpdate.bind(this)}
                                        onObjectSelected={this.handleSelectedObject.bind(this)}
                                        onCanvasDestroyed={this.onCanvasDestroyed.bind(this)}
                                    />
                                }

                                <TemplateRenderer
                                    key={template.id + '-' + activeRatio}
                                    activeRatio={activeRatio}
                                    renderMedias={renderMedias}
                                    template={template}
                                    clip={clip}
                                    currentWords={currentWords}
                                    selectedWord={selectedWord}
                                    selectedBlock={selectedBlock}
                                    activeBlock={selectedBlock}
                                    viewMode={viewMode}
                                    playing={playing}
                                    selectedMediaId={selectedMediaId}
                                    onWordChange={this.props.onWordChange}
                                    onWordSelect={this.props.onWordSelect}
                                    isMusic={isMusic}
                                    showOverflow={showOverflow}
                                />

                                {
                                    scaleSelectMode &&
                                    <div onClick={this.onPointSelection.bind(this)} className='point-selector' />
                                }

                                {
                                    this.props.renderScaleOriginSelection
                                }

                                {
                                    showOverflow && <div
                                        style={{
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                            height: '100%',
                                            position: 'absolute',
                                            outline: '2px #fff dashed',
                                            zIndex: 200,
                                            pointerEvents: 'none'
                                        }}
                                    />
                                }

                            </section>
                        </div>
                    </div>
                }

                {
                    template && this.canvasRef && !viewMode &&
                    <TemplateControls
                        importFromRatio={this.importFromRatio}
                        layoutConfig={layoutConfig}
                        addShape={this.addShape.bind(this)}
                        canvasObjects={layoutConfig.canvas.objects}
                        discardSelection={this.discardSelection.bind(this)}
                        selectObject={this.selectObject.bind(this)}
                        removeObject={this.removeObject.bind(this)}
                        updateCanvasObject={this.updateCanvasObject.bind(this)}
                        selectedObject={selectedObject}
                        updateGlobalObject={this.updateGlobalObject.bind(this)}
                        updateLinkedElement={this.updateLinkedElement.bind(this)}
                        //imageObjectChange={this.assetsRef && this.assetsRef.handleImageUpload.bind(this.assetsRef)}
                        execMethod={this.execMethod.bind(this)}
                        scaleObject={this.canvasRef.scaleObject.bind(this.canvasRef)}
                        toggleAssets={toggleAssets}
                        openAssets={toggleAssets}
                        containerBound={containerBound}
                        selectTemplateScaleOrigin={this.selectTemplateScaleOrigin.bind(this)}
                        specialKey={specialKey}>

                        <FormGroup
                            helperText={template.name? '':'Please enter a name'}
                            requiredLabel={true}
                            intent={template.name? Intent.PRIMARY: Intent.DANGER}
                            label={'Template Name'}>

                            <ControlGroup fill={true}>

                                <InputGroup
                                    required
                                    className='bp3-fill'
                                    type="text"
                                    placeholder="Template Name"
                                    onChange={this.templateNameChange}
                                    value={template.name}
                                />

                                <Button icon={'duplicate'} onClick={this.props.onCloneTemplate} />
                            </ControlGroup>
                        </FormGroup>

                        <FormGroup label={<span>Dimensions
                                <span className='push-right'>{RATIO.LABELS[activeRatio]}</span>
                            </span>}>
                            <ButtonGroup fill={true}>
                                {
                                    RATIO.ITEMS.map(ratio => <Button
                                        key={ratio}
                                        small={true}
                                        text={RATIO.UI_LABELS[ratio]}
                                        onClick={_ => this.switchRatio(ratio)}
                                        active={activeRatio === ratio} />)
                                }
                            </ButtonGroup>
                        </FormGroup>

                    </TemplateControls>
                }



                {
                    selectedObject && selectedLinkedObject &&
                    <Sidebar fixed right={true}>
                        <ElementControls
                            execMethod={this.execMethod.bind(this)}
                            updateCanvasObject={this.updateCanvasObject.bind(this)}
                            linkedElement={selectedLinkedObject}
                            selectedObject={selectedObject}
                            scaleObject={this.canvasRef.scaleObject.bind(this.canvasRef)}
                            updateLinkedElement={this.updateLinkedElement.bind(this)}
                            containerBound={containerBound}
                            selectScaleOrigin={this.selectScaleOrigin.bind(this)}
                            selectScaleOriginId={selectScaleOriginId}
                        >
                            {
                                selectedObject.type === SHAPES.HTML_TEXT &&
                                <div>
                                    <FormGroup label={'Text Content'}>

                                        <TextArea
                                            rows={3}
                                            growVertically={false}
                                            large={true}
                                            intent={Intent.PRIMARY}
                                            onChange={e => this.updateLinkedElement(selectedObject.id, {content: e.target.value})}
                                            value={selectedLinkedObject.content}
                                        />

                                    </FormGroup>

                                    <TextControls
                                        fontChange={this.fontChange.bind(this)}
                                        textConfig={selectedLinkedObject}
                                        onTextConfigChange={this.updateLinkedElement.bind(this, selectedObject.id)}
                                        fonts={this.props.fonts}
                                        loadFont={this.props.loadFont.bind(this)}
                                        isStatic={true}
                                        toggleAssets={toggleAssets}
                                    />
                                </div>
                            }

                            {
                                selectedObject.type === SHAPES.IMAGE2 &&
                                <div>

                                    <FormGroup label={'Preview'}>
                                        <img className='image-preview' src={selectedLinkedObject.src} />
                                        <Button text={'Replace Image'} onClick={e => toggleAssets(selectedObject)} />
                                    </FormGroup>

                                    <Switch
                                        label={'Attach to Visualizer'}
                                        checked={!!selectedLinkedObject.visualization}
                                        onChange={this.toggleVisualizer.bind(this, selectedObject.id, selectedLinkedObject)} />


                                    {
                                        selectedLinkedObject.visualization && <div>
                                            <FormGroup label={'Frequency Bin'}>
                                                <NumericInput
                                                    onValueChange={this.updateVisualizerConfig.bind(this, selectedObject.id, selectedLinkedObject, 'frequencyBin')}
                                                    value={selectedLinkedObject.visualization.frequencyBin} min={0} max={256} />
                                            </FormGroup>
                                            <FormGroup label={'Amplitude'}>
                                                <NumericInput
                                                    onValueChange={this.updateVisualizerConfig.bind(this, selectedObject.id, selectedLinkedObject, 'amplitude')}
                                                    value={selectedLinkedObject.visualization.amplitude} min={0} max={1} stepSize={0.1} />
                                            </FormGroup>
                                        </div>
                                    }
                                </div>
                            }


                            {
                                selectedObject.id === SHAPES.PROGRESS &&
                                <div>

                                    <ColorPicker
                                        label={'Background Color'}
                                        value={selectedLinkedObject.backgroundColor}
                                        handleColorChange={ color => this.updateLinkedElement(selectedObject.id, {'backgroundColor': color}) }
                                    />

                                    <ColorPicker
                                        label={'Color'}
                                        value={selectedLinkedObject.color}
                                        handleColorChange={ color => this.updateLinkedElement(selectedObject.id, {'color': color}) }
                                    />

                                </div>
                            }

                            {
                                selectedObject.id === SHAPES.VISUALIZATION &&
                                <VisControls
                                    visArea={visArea}
                                    onConfigChange={this.updateLinkedElement.bind(this, selectedObject.id)}
                                />
                            }

                            {
                                selectedObject.id === SHAPES.PARTICLES &&
                                <ParticlesControl
                                    area={area}
                                    onConfigChange={this.updateLinkedElement.bind(this, selectedObject.id)}
                                />
                            }

                            {
                                selectedObject.id === SHAPES.TEXT &&
                                <TextControls
                                    readOnly={viewMode}
                                    fontChange={this.fontChange.bind(this)}
                                    textConfig={textArea}
                                    onTextConfigChange={this.updateLinkedElement.bind(this, selectedObject.id)}
                                    fonts={this.props.fonts}
                                    loadFont={this.props.loadFont}
                                />
                            }
                        </ElementControls>
                    </Sidebar>
                }



            </div>
        )
    }
}

const NOOP = ()=>{}

ClipLayout.defaultProps = {
    onWordChange: NOOP,
    onWordSelect: NOOP
}

const mapStateToProps = (state, props) => {

    let ret = {
        ...state.template,
        template: state.template.present
    }

    return ret
}

export default  connect(mapStateToProps, null, null, { forwardRef: true })(ClipLayout)