import {
    Button,
    FormGroup,
    Popover,
    MenuItem,
    Position,
    Menu
} from "@blueprintjs/core"
import FileDrop from 'react-file-drop'
import React, {Component, useState}  from 'react';

const SpeakerControl = (props) => {

    const {updateLinkedElement, element} = props

    const SPEAKERS = {
        '1': 'Speaker A',
        '2': 'Speaker B'
    }

    return <FormGroup label={'Speaker'}>
        <Popover
            position={Position.BOTTOM}
            content={<Menu>{
                Object.entries(SPEAKERS).map(([id, text]) => <MenuItem
                    key={id}
                    active={parseInt(id) === element.speaker}
                    text={text}
                    onClick={e => updateLinkedElement(element.id, {speaker: parseInt(id)})}
                />)
            }</Menu>}>
            <Button icon="person" text={SPEAKERS[element.speaker]} />
        </Popover>
    </FormGroup>
}

export default SpeakerControl