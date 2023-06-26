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
import FileDrop from 'react-file-drop'
import React, {Component, useState}  from 'react';

const ProgressBarControls = (props) => {

    const {
        element, title, onFontChange, updateLinkedElement,
        fonts, onSelect, execMethod, showSpeaker, showContent, selectedObject, isCaption
    } = props

    const selected = selectedObject && selectedObject.id === element.id

    return <div
        className={`element-controls ${element.hide ? 'inactive' : ''} ${selected ? 'selected' : ''} `}>


        <div className='flex space-between'>
            <Switch label={title} checked={!element.hide}
                    onChange={e => updateLinkedElement(element.id, {hide: !element.hide})}/>

            {
                selected &&
                <ButtonGroup>
                    <Button
                        minimal={true}
                        intent={Intent.PRIMARY}
                        onClick={e => execMethod(element.id, 'centerH')}
                        icon={'alignment-vertical-center'}
                    />

                    <Button
                        minimal={true}
                        intent={Intent.PRIMARY}
                        onClick={e => execMethod(element.id, 'centerV')}
                        icon={'alignment-horizontal-center'}
                    />
                </ButtonGroup>
            }
        </div>

        <Collapse isOpen={!element.hide}>
            <Card interactive={true} onClick={onSelect}>

                {
                    (showContent || showSpeaker) && <div className='full-line'>

                        {
                            showContent &&
                            <FormGroup label={'Content'}>
                                <InputGroup
                                    value={element.content}
                                    onChange={e => updateLinkedElement(element.id, {'content': e.target.value})}/>
                            </FormGroup>
                        }

                        {
                            showSpeaker &&
                            <SpeakerControl
                                element={element}
                                updateLinkedElement={updateLinkedElement}
                            />
                        }
                    </div>
                }


                <ColorPicker

                    label={'Color'}
                    hideInput={true}
                    value={element.color}
                    handleColorChange={ color => updateLinkedElement(element.id, {'color': color}) }
                />

                <ColorPicker
                    label={'BG Color'}
                    hideInput={true}
                    value={element.backgroundColor}
                    handleColorChange={ color => updateLinkedElement(element.id, {'backgroundColor': color}) }
                />
            </Card>
        </Collapse>
    </div>
}

export default ProgressBarControls