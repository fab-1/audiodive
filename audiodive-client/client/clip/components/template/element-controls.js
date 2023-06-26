import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    InputGroup,
    Card,
    FormGroup,
    H4,
    Icon,
    Switch,
    Slider,
    Tab,
    Tabs,
    NumericInput, MenuItem, MenuDivider, Tree, Classes, ButtonGroup
} from "@blueprintjs/core";
import UI_TEXT from "../../ui-text";
import Accordion from "../shared/accordion";
import GifControls from './gif-controls.jsx'
import BoxControls from "../../../shared/controls/box-controls"
import TransitionControls from "./transition-controls";
import {Utils} from "../../../shared/utils";
import ELEMENTS from '../shared/elements'

const DEFAULT_TRANSITION = {
    cssProperty: 'opacity',
    easing: 'Sine',
    acceleration: 'easeOut',
    duration: 0.3
}

class ElementControls extends Component {

    constructor(){
        super()
        this.state = {
            type: 'showTransition'
        }
    }

    componentDidMount() {
        this.setState({
            type: 'showTransition'
        })
    }


    onTransitionElementSwitched (id, linkedElement, transitionType) {

        this.props.updateLinkedElement(id, {
            [transitionType]: linkedElement[transitionType]? undefined:DEFAULT_TRANSITION
        })
    }

    testElementTransition (object, elementConfig, transitionType) {

        const transitionConfig = elementConfig[transitionType]
        const domElement = document.getElementById(object.id)
        const isStart = transitionType === 'showTransition'

        Utils.animateElement(domElement, object, transitionConfig, this.props.containerBound, isStart)
    }

    tabChange(type) {
        this.setState({
            type
        })
    }

    render() {

        const {selectedObject, linkedElement, updateLinkedElement} = this.props

        const isGif = (element) => {
            return element.gifSettings && element.src && element.src.includes('.gif')
        }

        const hasChildren = (children) => {
            return children.reduce((acc, child) => child || acc)
        }


        let sections = [
            {
                text: 'Animation',
                isClosed: true,
                icon: 'clean',
                content: <div>
                    {
                        selectedObject.id === 'dynamicArea'?
                            <Card elevation={0}>
                                Transitions are not available for this type of element.
                            </Card>:<div>

                                <H4>Show Effects</H4>
                                <Switch
                                    checked={!!linkedElement.showTransition}
                                    label="Enable"
                                    onChange={this.onTransitionElementSwitched.bind(this, selectedObject.id, linkedElement, 'showTransition')}
                                />

                                {
                                    linkedElement.showTransition &&
                                    <TransitionControls
                                        showTextProperty={selectedObject.type === 'htmlText'}
                                        isTemplateElement={true}
                                        transition={'showTransition'}
                                        config={linkedElement.showTransition}
                                        selectScaleOrigin={_ => this.props.selectScaleOrigin(selectedObject.id,'showTransition')}
                                        onChange={val => this.props.updateLinkedElement(selectedObject.id, {showTransition: val})}
                                        previewAnim={this.testElementTransition.bind(this, selectedObject, linkedElement, 'showTransition')}
                                        scaleActive={this.props.selectScaleOriginId === selectedObject.id}
                                    />
                                }


                                <H4>Hide Effects</H4>
                                <Switch
                                    checked={!!linkedElement.hideTransition}
                                    label="Enable"
                                    onChange={this.onTransitionElementSwitched.bind(this, selectedObject.id, linkedElement, 'hideTransition')}
                                />

                                {
                                    linkedElement.hideTransition &&
                                    <TransitionControls
                                        showTextProperty={selectedObject.type === 'htmlText'}
                                        isTemplateElement={true}
                                        transition={'hideTransition'}
                                        config={linkedElement.hideTransition}
                                        onChange={val => this.props.updateLinkedElement(selectedObject.id, {hideTransition: val})}
                                        previewAnim={this.testElementTransition.bind(this, selectedObject, linkedElement, 'hideTransition')}
                                    />
                                }
                            </div>
                    }
                </div>
            }
        ]

        const type = ELEMENTS.getType(selectedObject)
        const icon = ELEMENTS.TYPES_ICONS[type]
        const typeText = ELEMENTS.TYPES_LABELS[type]

        if (hasChildren(this.props.children)) {

            sections.splice(0, 0, {
                text: 'Style', //`${typeText}`,
                icon: 'style',
                isClosed: true,
                content: <div>{this.props.children}</div>
            })
        }


        return (<div>

            <div className='flex space-between'>
                <H4><Icon iconSize={20} icon={icon} /> {typeText} </H4>
                <Switch
                    checked={!linkedElement.hide}
                    onChange={e => this.props.updateLinkedElement(selectedObject.id, {hide: !linkedElement.hide})}
                />
            </div>

            <FormGroup label={'Name'}>
                <InputGroup
                    fill={true}
                    //readOnly={isReserved(selectedObject)}
                    placeholder="Name"
                    value={selectedObject.name}
                    onChange={event => this.props.updateCanvasObject(selectedObject.id, 'name' , event.target.value)}
                />
            </FormGroup>

            <FormGroup inline={true} label={'Center Element'}>
                <Button
                    //text={'Horizontally'}
                    onClick={e => this.props.execMethod(selectedObject.id, 'centerH')}
                    icon={'alignment-vertical-center'}
                />

                <Button
                    //text={'Vertically'}
                    onClick={e => this.props.execMethod(selectedObject.id, 'centerV')}
                    icon={'alignment-horizontal-center'}
                />
            </FormGroup>

            <BoxControls
                updateBox={this.props.updateCanvasObject}
                scaleObject={this.props.scaleObject}
                selectedObject={selectedObject}
            />

            {
                linkedElement && isGif(linkedElement) &&
                <GifControls
                    config={linkedElement.gifSettings}
                    onChange={val => this.props.updateLinkedElement(selectedObject.id, {gifSettings: val})}
                />
            }

            <FormGroup label={'Opacity'}>
                <Slider
                    min={0}
                    max={1}
                    stepSize={0.1}
                    onChange={val => this.props.updateLinkedElement(selectedObject.id, {opacity: val})}
                    labelRenderer={false}
                    value={linkedElement.opacity === undefined?1:linkedElement.opacity}
                />
            </FormGroup>

            <FormGroup label={'Border Radius'}>

                <NumericInput
                    prop="borderRadius"
                    value={linkedElement.borderRadius || 0}
                    onValueChange={value => this.props.updateLinkedElement(selectedObject.id, {borderRadius: value})}
                />

            </FormGroup>

            <FormGroup>

                <Switch
                    label={'Only Show for'}
                    checked={!!linkedElement.speaker}
                    onChange={e => updateLinkedElement(selectedObject.id, {speaker: linkedElement.speaker?undefined:1})}
                />

                <ButtonGroup>
                    <Button
                        active={linkedElement.speaker === 1}
                        disabled={!linkedElement.speaker}
                        text={'Speaker A'}
                        onClick={e => updateLinkedElement(selectedObject.id, {speaker: 1})}
                    />
                    <Button
                        active={linkedElement.speaker === 2}
                        disabled={!linkedElement.speaker}
                        text={'Speaker B'}
                        onClick={e => updateLinkedElement(selectedObject.id, {speaker: 2})}
                    />
                </ButtonGroup>
            </FormGroup>

            <hr />

            <Accordion sections={sections} />
        </div>)
    }
}

ElementControls.propTypes = {};

export default ElementControls;