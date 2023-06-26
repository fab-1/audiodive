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
import React, {Component, useState}  from 'react';

import FileDrop from 'react-file-drop'
import SpeakerControl from './speaker-control'

const ImageControls = (props) => {

    const {element, updateLinkedElement, imageUpload, onDrop, title,
        onSelect, showSpeaker, selectedObject, execMethod, hideOpacity, canEditTemplate} = props

    const [openImageUpload, setOpenImageUpload] = useState(0);
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

                    {
                        props.children
                    }

                    {
                        element.src && <img style={{height: '50px'}} height={50} src={element.src} />
                    }

                    <FormGroup label={'Picture'}>
                        <Popover
                            isOpen={openImageUpload}
                            position={Position.BOTTOM}
                            content={
                                <ButtonGroup vertical={true}>
                                    <label className='bp3-button'>
                                        <input onChange={imageUpload} type="file" hidden />
                                        <span className='bp3-button-text'>Upload</span>
                                    </label>
                                </ButtonGroup>
                            }>
                            <Button onClick={() => setOpenImageUpload(!openImageUpload)} disabled={!canEditTemplate} icon="media" text={'Change'} />
                        </Popover>
                    </FormGroup>



                    {
                        !hideOpacity &&  <FormGroup label={'Opacity'}>
                            <Slider
                                min={0}
                                max={1}
                                stepSize={0.1}
                                onChange={val => updateLinkedElement(element.id, {opacity: val})}
                                labelRenderer={false}
                                value={element.opacity === undefined?1:element.opacity}
                            />
                        </FormGroup>
                    }


                    {
                        showSpeaker &&
                        <SpeakerControl
                            element={element}
                            updateLinkedElement={updateLinkedElement}
                        />
                    }
                </Card>
            </FileDrop>
        </Collapse>
    </div>
}

export default ImageControls