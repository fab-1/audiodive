import React from "react"
import {
    Card,
    MenuDivider,
    Button,
    ButtonGroup,
    Classes,
    Icon,
    Intent,
    Menu,
    MenuItem,
    NumericInput,
    Popover,
    Position,
    Label,
    Tooltip,
    FormGroup,
    Tree,
    Switch,
    Tab,
    Tabs, H4, InputGroup
} from "@blueprintjs/core"
import {Select} from '@blueprintjs/select'
import Panel from '../clip-editor/panel.jsx'

import TransitionControls from './transition-controls'
import ColorPicker from './color-picker.js'
import withStorage from "../shared/with-storage"
import debounce from 'lodash/debounce'
import BoxControls from "../../../shared/controls/box-controls"
import UI_TEXT from '../../ui-text'
import SHAPES from './shapes'
import {Utils} from '../../../shared/utils'
import Accordion from '../shared/accordion'
import SideBar from '../shared/sidebar'
import ELEMENTS from '../shared/elements'
const TEMPLATE_TABS = {
    GENERAL: 'general',
    LAYERS: 'layers'
}

import CustomIcons from '../../../shared/custom-icons'
import RATIO from "../../../shared/video-ratio";
import {filterGeneric, renderGeneric} from "../../../shared/controls/custom-select";

const DEFAULT_TRANSITION = {
    cssProperty: 'opacity',
    easing: 'Sine',
    acceleration: 'easeOut',
    duration: 0.2
}



const DEFAULT_STATE = {
}

const PersistentComponent = withStorage(
    React.Component,
    'TemplateControls',
    [],
    DEFAULT_STATE
)

const TYPES = ['showTransition', 'hideTransition']

export default class TemplateControls extends React.Component {

    constructor() {
        super()
        this.state = {
            tab: TEMPLATE_TABS.GENERAL,
            tabEl: TEMPLATE_TABS.GENERAL,
            transition: 'showTransition'
        }
    }

    componentDidMount(){

        const {layoutConfig} = this.props

        // TYPES.forEach((type) => {
        //     !layoutConfig[type] && this.props.updateGlobalObject(type, DEFAULT_TRANSITION)
        // })

        this.setState({transition: 'showTransition'})
        //this.transitionTemplateSwitched(this.props.layoutConfig, 'showTransition')
        this.debouncedObjectUpdate = debounce(this.props.updateCanvasObject, 300)
    }

    onKeyDown(e){
        console.log(e)
    }

    transitionTypeChange(transition) {
        this.setState({transition})
    }

    getTree() {

        const {canvasObjects, selectedObject} = this.props

        const size = canvasObjects.length

        let ret = new Array(size)

        canvasObjects.forEach((obj, index) => {

            const type = ELEMENTS.getType(obj)

            let node = {
                id: obj.id,
                label: obj.name,
                isSelected: selectedObject && selectedObject.id === obj.id,
                icon: ELEMENTS.TYPES_ICONS[type],
                nodeData: obj
            }

            ret[size-index-1] = node
        })

        return ret
    }

    handleNodeClick (node) {
        if (node.nodeData) {
            this.props.selectObject(node.nodeData.id)
        }
    }

    handleNodeCollapse (nodeData) {
    }

    handleNodeExpand (nodeData) {
    }

    tabChange (transition) {
        this.setState({transition})
    }

    testElementTransition (object, elementConfig, transitionType) {

        const transitionConfig = elementConfig[transitionType]
        const domElement = document.getElementById(object.id)
        const isStart = transitionType === 'showTransition'

        Utils.animateElement(domElement, object, transitionConfig, this.props.containerBound, isStart)
    }

    testTemplateTransition (elementConfig, transitionType) {

        const transitionConfig = elementConfig[transitionType]
        const domElement = document.getElementById('template-camera')
        const container = this.props.containerBound
        const object = {
            width: container.width,
            height: container.height,
            top: 0,
            left: 0
        }

        const isStart = transitionType === 'showTransition'

        Utils.animateElement(domElement, object, transitionConfig, container, isStart)
    }

    testAllTransitions() {
        const {layoutConfig, canvasObjects, containerBound} = this.props

        canvasObjects.forEach(object => {
            const element = layoutConfig.linkedElements[object.id]
            if (element && element.showTransition) {
                this.testElementTransition(object, element, 'showTransition')
            }
        })

        this.testTemplateTransition(layoutConfig, 'showTransition')
    }


    transitionTemplateSwitched (config, transition) {

        this.props.updateGlobalObject(transition, (config[transition]? undefined:DEFAULT_TRANSITION))

    }

    render() {
        const {selectedObject, layoutConfig, importFromRatio} = this.props
        const {transition} = this.state

        const layers = this.getTree()
        const bgSplit = layoutConfig.backgroundImage && layoutConfig.backgroundImage.split('/')
        const bgImage = bgSplit && bgSplit[bgSplit.length - 1]
        const linkedElement = selectedObject && layoutConfig.linkedElements[selectedObject.id]

        const sections = [
            {
                icon: 'edit',
                text: 'Properties',
                content: <div>

                    {this.props.children}

                    {/*<FormGroup label={'Background Image'}>*/}
                        {/*{*/}
                            {/*bgImage?*/}
                                {/*<div>*/}
                                    {/*<a href={layoutConfig.backgroundImage}>{bgImage}</a>*/}
                                    {/*<Button small={true} className={'push-right'} onClick={ _=> this.props.updateGlobalObject('backgroundImage', null)} text={'clear'}  />*/}
                                {/*</div>:*/}
                                {/*<Button onClick={this.props.openAssets} icon={CustomIcons.imagesIcon} text={'Insert Image'} />*/}
                        {/*}*/}
                    {/*</FormGroup>*/}

                    <ColorPicker
                        label={'Background Color'}
                        value={layoutConfig.backgroundColor}
                        handleColorChange={color => this.props.updateGlobalObject('backgroundColor', color)}
                    />

                    <Popover
                        className='push-right'
                        position={Position.BOTTOM}
                        content={<Menu>

                            <MenuItem icon={'media'}
                                      text={'Image'}
                                      onClick={() => this.props.openAssets()} />

                            <MenuItem icon={'new-text-box'}
                                      text={'Static Text'}
                                      onClick={e => this.props.addShape(SHAPES.HTML_TEXT)} />

                            <MenuItem icon={'segmented-control'}
                                      text={'Clip Progress'}
                                      onClick={e => this.props.addShape(SHAPES.PROGRESS)} />
                            <MenuDivider />

                            <MenuItem icon={'comment'}
                                      text={'Closed Captions'}
                                //disabled={layoutConfig[SHAPES.TEXT]}
                                      onClick={e => this.props.addShape(SHAPES.TEXT)} />

                            <MenuItem icon={'film'}
                                      text={'Dynamic Medias'}
                                      disabled={layoutConfig.linkedElements[SHAPES.DYNAMIC]}
                                      onClick={e => this.props.addShape(SHAPES.DYNAMIC)} />

                            <MenuItem icon={'timeline-bar-chart'}
                                      text={'Visualization'}
                                      onClick={e => this.props.addShape(SHAPES.VISUALIZATION)} />

                            <MenuItem icon={'snowflake'}
                                      text={'Particles'}
                                      onClick={e => this.props.addShape(SHAPES.PARTICLES)} />
                        </Menu>}>
                        <Button
                            text={'Add'}
                            intent={Intent.PRIMARY}
                            icon="add" />
                    </Popover>
                    <FormGroup label='Elements' />

                    {
                        layers.length !== 0 &&
                        <Tree
                            className={Classes.ELEVATION_0}
                            contents={layers}
                            onNodeClick={this.handleNodeClick.bind(this)}
                            onNodeCollapse={this.handleNodeCollapse.bind(this)}
                            onNodeExpand={this.handleNodeExpand.bind(this)}
                        />
                    }

                    {
                        layers.length === 0 &&
                        <Card elevation={0} className='no-elements'>
                            <Label>No Elements Yet</Label>

                            <Popover content={<div>
                                    <ButtonGroup fill={true}>
                                        {
                                            RATIO.ITEMS.map(ratio => <Button
                                                key={ratio}
                                                text={RATIO.UI_LABELS[ratio]}
                                                onClick={_ => importFromRatio(ratio)}
                                            />)
                                        }
                                    </ButtonGroup>
                                </div>}>
                                <Button minimal={true} text={'Import elements from...'} />
                            </Popover>

                        </Card>
                    }

                    <Button
                        fill={true}
                        icon={'play'}
                        className='margin-bottom-10'
                        text={'Test All Transitions'}
                        onClick={this.testAllTransitions.bind(this)} />

                    <ButtonGroup>
                        <Tooltip content={UI_TEXT.BACKWARD}>
                            <Button
                                text={'To Back'}
                                disabled={!selectedObject}
                                onClick={e => this.props.execMethod(selectedObject.id, 'sendBackwards')}
                                icon={'arrow-down'}
                            />
                        </Tooltip>

                        <Tooltip content={UI_TEXT.FORWARD}>
                            <Button
                                text={'To Front'}
                                disabled={!selectedObject}
                                onClick={e => this.props.execMethod(selectedObject.id, 'bringForward')}
                                icon={'arrow-up'}
                            />
                        </Tooltip>
                    </ButtonGroup>

                    <Button icon={'duplicate'} text={'Clone'}
                            onClick={e=> this.props.execMethod(selectedObject.id, 'copy')} />


                    <Button
                        disabled={!selectedObject}
                        intent={Intent.DANGER}
                        onClick={e => this.props.removeObject(selectedObject.id)}
                        text={'Remove'}
                        icon={'trash'}
                    />

                </div>
            },
            // {
            //     text: 'Layout',
            //     icon: 'control',
            //     content: <div>
            //
            //
            //
            //     </div>
            // },
            {
                text: 'Effects',
                icon: 'clean',
                isClosed: true,
                content: <div>
                    <div>

                        <Tabs selectedTabId={transition} onChange={this.tabChange.bind(this)}>
                            <Tab
                                id='showTransition'
                                title={'Transition In'}
                                panel={
                                    <div>
                                        <Switch
                                            checked={!!layoutConfig.showTransition}
                                            label="Enable"
                                            onChange={this.transitionTemplateSwitched.bind(this, layoutConfig, 'showTransition')}
                                        />

                                        {
                                            layoutConfig.showTransition &&
                                            <TransitionControls
                                                transition={'showTransition'}
                                                config={layoutConfig.showTransition}
                                                onChange={val => this.props.updateGlobalObject('showTransition',  val)}
                                                previewAnim={this.testTemplateTransition.bind(this, layoutConfig, 'showTransition')}
                                                scaleActive={this.props.specialKey}
                                                selectScaleOrigin={_ => this.props.selectTemplateScaleOrigin()}
                                                isTemplate={true}
                                            />
                                        }

                                    </div>
                                }
                            />

                            <Tab
                                id='hideTransition'
                                title={'Transition Out'}
                                panel={<div>
                                    <Switch
                                        checked={!!layoutConfig.hideTransition}
                                        label="Enable"
                                        onChange={this.transitionTemplateSwitched.bind(this, layoutConfig, 'hideTransition')}
                                    />

                                    {
                                        layoutConfig.hideTransition &&
                                        <TransitionControls
                                            transition={'hideTransition'}
                                            config={layoutConfig.hideTransition}
                                            onChange={val => this.props.updateGlobalObject('hideTransition',  val)}
                                            previewAnim={this.testTemplateTransition.bind(this, layoutConfig, 'hideTransition')}
                                            isTemplate={true}
                                        />
                                    }

                                </div>}
                            />
                        </Tabs>





                    </div>
                </div>
            }
        ]

        return <SideBar fixed>

            <H4>Template Editor</H4>

            <Accordion
                sections={sections}
            />
        </SideBar>
    }
}

