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
    TagInput,
    Position,
    ButtonGroup, H4, H5, H2, H3, NumericInput, Menu
} from "@blueprintjs/core"
import React, {Component, useState}  from 'react';
import axios from 'axios'
import Validator from 'validator'
import Loading from './loading.js'

const ShareClipForm = (props) => {

    const {clipId} = props

    const [emails, setEmails] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);
    const [sending, setSending] = useState(false);
    //const hidden = element.hide?'hidden':''

    const inviteeChange = (val) => {

        let emailsValid = true
        val.forEach(email => {
            if (!Validator.isEmail(email)) {
                emailsValid = false
            }
        })


        if (!emailsValid) {
            return setErrorMsg('One of the emails is not valid')
        }

        setEmails(val)
        setErrorMsg(null)
    }

    const sendInvite = () => {

        setSending(true)

        axios.post(`/admin/api/user/invite`, {
            invitees: emails,
            clipId
        }).
        then(res => {
            setSending(false)
        }).
        catch(e => setSending(false))
    }


    return  <FormGroup label='Share Clip'>
        <Loading show={sending} />
        <ControlGroup fill={true} vertical={false}>
            <TagInput
                fill={true}
                addOnBlur={true}
                values={emails}
                onChange={inviteeChange}
                leftIcon='user'
                tagProps={{
                    intent: (Intent.PRIMARY)
                }}
                inputProps={{
                    intent: (errorMsg?Intent.DANGER:Intent.PRIMARY)
                }}
            />
            <Button
                text={'Share'}
                onClick={sendInvite}
            />

        </ControlGroup>
    </FormGroup>
}

export default ShareClipForm