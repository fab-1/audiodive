import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Intent} from "@blueprintjs/core/lib/esm/index"

class InviteForm extends Component {

    state = {
        invitees: [],
        message: 'Hey, join me on AudioDive',

    }



    inviteeChange = (val) => {

        if (val.length > 1) {
            return this.setState({
                errorMsg: 'You can invite one person only'
            })
        }

        let emailsValid = true
        val.forEach(email => {
            if (!Validator.isEmail(email)) {
                emailsValid = false
            }
        })


        if (!emailsValid) {
            return this.setState({
                errorMsg: 'One of the emails is not valid'
            })
        }

        this.setState({
            invitees: val,
            errorMsg: null
        })
    }

    render() {
        return (
            <div>

                <FormGroup
                    helperText={errorMsg}
                    label={'Email'}>
                    <TagInput
                        large={true}
                        values={invitees}
                        onChange={this.inviteeChange.bind(this)}
                        leftIcon='user'
                        tagProps={{
                            intent: (Intent.PRIMARY)
                        }}
                        inputProps={{
                            intent: (errorMsg?Intent.DANGER:Intent.PRIMARY)
                        }}
                    />
                </FormGroup>

                <FormGroup
                    label={'Note'}>
                    <TextArea
                        rows={4}
                        growVertically={false}
                        large={true}
                        fill={true}
                        onChange={e => this.setState({message: e.target.value})}
                        value={message}
                    />
                </FormGroup>
            </div>
        )
    }
}

InviteForm.propTypes = {}

export default InviteForm
