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
import ColorPicker from '../template/color-picker'
import React, {Component, useState}  from 'react';
import FileDrop from 'react-file-drop'

const VisControls = (props) => {

    const {element, updateLinkedElement, imageUpload, onDrop, title, onSelect, showSpeaker, selectedObject, execMethod} = props

    //const hidden = element.hide?'hidden':''

    const selected = selectedObject && selectedObject.id === element.id

    return  <div
        className={`element-controls ${element.hide?'inactive':''} ${selected?'selected':''} `}>

        <div className='flex space-between'>
            <Switch label={title} checked={!element.hide} onChange={e => updateLinkedElement(element.id, {hide: !element.hide})} />

            {
                selected &&
                <ButtonGroup>
                    <Button
                        intent={Intent.PRIMARY}
                        minimal={true}
                        onClick={e => execMethod(element.id, 'centerH')}
                        icon={'alignment-vertical-center'}
                    />

                    <Button
                        intent={Intent.PRIMARY}
                        minimal={true}
                        onClick={e => execMethod(element.id, 'centerV')}
                        icon={'alignment-horizontal-center'}
                    />
                </ButtonGroup>
            }
        </div>

        <Collapse isOpen={!element.hide}>
            <FileDrop onDrop={onDrop}>

                <Card interactive={true} onClick={onSelect}>

                    <ColorPicker
                        hideInput={true}
                        type={'hsl'}
                        label={'Color'}
                        value={element.hslColor}
                        handleColorChange={ color => updateLinkedElement(element.id, {'hslColor': color}) }
                    />

                    <FormGroup label={'Opacity'}>
                        <Slider
                            min={0}
                            max={1}
                            stepSize={0.1}
                            onChange={val => updateLinkedElement(element.id, {opacity: val})}
                            labelRenderer={false}
                            value={element.opacity === undefined?1:element.opacity}
                        />
                    </FormGroup>

                    <FormGroup label={'Size'}>
                        <NumericInput
                            className={'size-input'}
                            onValueChange={val => updateLinkedElement(element.id, {'sampleSize': val})}
                            value={element.sampleSize}
                            stepSize={1}
                        />
                    </FormGroup>
                </Card>
            </FileDrop>
        </Collapse>
    </div>
}

export default VisControls