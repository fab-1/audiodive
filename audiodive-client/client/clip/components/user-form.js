import React, {Component} from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import {MenuItem, H5, H6, Button, Switch, ControlGroup, TextArea, InputGroup, TagInput, Tab, Tabs, FormGroup} from '@blueprintjs/core'
import {Select} from '@blueprintjs/select'
import store from 'store'
import Loading from './shared/loading'
import {filterGeneric, renderGeneric} from "../../shared/controls/custom-select"
import {Intent} from "@blueprintjs/core/lib/esm/index"
import Validator from 'validator'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import NiceButton from './shared/nice-button'


const TABS = {
    GENERAL: 'general',
    ACCOUNT: 'account'
}

const ROLES = {
    admin: 'Lead Editor',
    contributor: 'Editor'
}

const TEMPLATE_TABS = {
    ACCOUNT: 'account',
    ADMIN: 'admin',
    SETTINGS: 'settings',
    PLAN: 'plan'
}

class UserForm extends Component {

    state = {
        userPlan: null,
        activeTab: TABS.ACCOUNT,
        email: '',
        sending: false,
        invitees: [],
        inviteUrls: [],
        userSettings: {

        },
        message: 'Cool app alert! Check it out!'
    }

    componentDidMount() {
        //this.loadUser()
        //this.loadUsers()
        const savedSettings = localStorage.getItem('userSettings')
        if (savedSettings) {
            const userSettings = JSON.parse(savedSettings)
            this.setState({userSettings})
        }
        else {
            this.setState({userSettings: {
                    dark:true
                }})
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.userSettings !== this.state.userSettings) {
            localStorage.setItem( 'userSettings', JSON.stringify( this.state.userSettings ))
            document.body.className = this.state.userSettings.dark?'bp3-dark':''
            //return false
        }
    }

    loadUser() {
        this.setState({loading: true})
        axios.get(`/admin/api/user/plan`).
        then(res => {
            this.setState({
                userPlan: res.data,
                loading: false,
                networkName: ''
            })
        })
    }


    handleTabChange(v) {
        this.setState({
            activeTab: v
        })
    }

    loadNetwork(network){
        window.location.href = '/admin/switch_network/' + network.id
    }

    // sendInvite() {
    //
    //     this.setState({
    //         sending: true
    //     })
    //
    //     axios.post('/admin/api/creator/invite', {
    //         email: this.state.email
    //     }).
    //     then(res => {
    //         this.setState({
    //             sending: false
    //         })
    //     }).
    //     catch(err => {
    //         this.setState({
    //             sending: false
    //         })
    //     })
    // }

    clearSettings() {
        store.clearAll()
    }

    handleTabChange(tab) {
        this.setState({tab})
    }

    addNetwork(){
        axios.post('/admin/api/creator/network', {
            name: this.state.networkName
        }).
        then(res => {
            this.loadUser()
        })
    }

    inviteeChange = (val) => {

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

    sendInvite = () => {
        const {invitees, message, addFriend, clip} = this.state

        this.setState({
            sending: true,
            loadingMessage: 'Sending Invites...'
        })

        axios.post(`/admin/api/user/invite`, {
            invitees,
            message,
            addFriend: false
        }).
        then(res => {

            this.setState({
                sending: false,
                loadingMessage: '',
                inviteUrls: res.data
            })
        })
    }

    settingsChange = ({target}) => {


        const userSettings = Object.assign({}, {
            [target.name]: target.checked
        }, this.props.userSettings)

        this.setState({userSettings})
    }

    formatMinutes(seconds) {
        const minutes = Math.floor(seconds / 60)
        const remainingSec = seconds - (minutes * 60)
        return `${minutes}mn` + (remainingSec?`${remainingSec}s`:'')
    }

    render() {

        let networkName, role
        const {user, userPlan} = this.props
        const {loading, invitees, errorMsg, message, inviteUrls, userSettings} = this.state

        if (!user) return <div className='user-form' />

       // const [network] = user.Networks

        // let activeNetwork
        // if (user.isAdmin && user.currentNetworkId) {
        //     activeNetwork = user.Networks.find(network => network.id === user.currentNetworkId)
        //     role = 'Admin'
        // }
        // else {
        //     activeNetwork = network
        //     role = activeNetwork.NetworkCreators && ROLES[network.NetworkCreators.type]
        // }

        return (
            <div className='user-form'>



                {/*<div className='push-right'>*/}
                    {/*{*/}
                        {/*user.isAdmin? <Select*/}
                            {/*noResults={<MenuItem disabled={true} text="No results." />}*/}
                            {/*items={user.Networks}*/}
                            {/*itemPredicate={filterGeneric}*/}
                            {/*itemRenderer={renderGeneric}*/}
                            {/*onItemSelect={this.loadNetwork.bind(this)}>*/}
                            {/*<Button*/}
                                {/*rightIcon="caret-down"*/}
                                {/*text={activeNetwork? activeNetwork.name:'Select Network'}*/}
                            {/*/>*/}
                        {/*</Select>:<H6 className='bp3-text-muted'>{activeNetwork? activeNetwork.name:''}</H6>*/}
                    {/*}*/}
                {/*</div>*/}

                <div className='user-general'>
                    <section className='flex'>
                        <H5>{user.fullName}</H5>
                        {/*<span className='bp3-tag bp3-intent-primary'>{role}</span>*/}
                    </section>
                </div>


                {
                    userPlan && userPlan.currentPlan &&
                    <Tabs
                        onChange={this.handleTabChange.bind(this)}
                        selectedTabId={this.state.tab} >

                        <Tab
                            id={TEMPLATE_TABS.ACCOUNT}
                            key={TEMPLATE_TABS.ACCOUNT}
                            title={<span>Account</span>}
                            panel={<div>
                                <iframe
                                    style={{
                                        position: 'relative',
                                        top: '0px',
                                        height: '568px',
                                        width:'100%'
                                    }}
                                    src={'/account?iframe=true'}
                                />
                            </div>}
                        />

                        {/*<Tab*/}
                            {/*id={TEMPLATE_TABS.PLAN}*/}
                            {/*key={TEMPLATE_TABS.PLAN}*/}
                            {/*title={<span>Plan</span>}*/}
                            {/*panel={<div>*/}

                                {/*{*/}
                                    {/*userPlan && <div>*/}
                                        {/*<Tag.Group gapless>*/}
                                            {/*<Tag>Current Plan</Tag>*/}
                                            {/*<Tag color='primary'>{userPlan.currentPlan.name}</Tag>*/}
                                        {/*</Tag.Group>*/}

                                        {/*<Columns>*/}
                                            {/*<Columns.Column>*/}
                                                {/*<H5>Audio Imported</H5>*/}
                                                {/*<Tag.Group gapless>*/}
                                                    {/*<Tag color='info'>{this.formatMinutes(userPlan.audioImported)}</Tag>*/}
                                                    {/*<Tag color='dark'>{this.formatMinutes(userPlan.currentPlan.maxSecondsImport)}</Tag>*/}
                                                {/*</Tag.Group>*/}


                                            {/*</Columns.Column>*/}
                                            {/*<Columns.Column>*/}
                                                {/*<H5>Video Exported</H5>*/}
                                                {/*<Tag.Group gapless>*/}
                                                    {/*<Tag color='success'>{this.formatMinutes(userPlan.videoExported)}</Tag>*/}
                                                    {/*<Tag color='dark'>{this.formatMinutes(userPlan.currentPlan.maxSecondsExport)}</Tag>*/}
                                                {/*</Tag.Group>*/}

                                            {/*</Columns.Column>*/}
                                        {/*</Columns>*/}

                                        {/*<p>Your plan will renew <strong>{userPlan.daysUntilNextCycle}</strong></p>*/}
                                    {/*</div>*/}
                                {/*}*/}

                                {/*<Loading show={loading} />*/}
                            {/*</div>}*/}
                        {/*/>*/}

                        <Tab
                            id={TEMPLATE_TABS.SETTINGS}
                            key={TEMPLATE_TABS.SETTINGS}
                            title={<span>UI Settings</span>}
                            panel={<div>
                                <FormGroup inline={true} label={'Dark Theme'}>
                                    <Switch name={'dark'} checked={userSettings.dark} onChange={this.settingsChange} />
                                </FormGroup>



                                <Button text={'Clear Settings'} onClick={this.clearSettings.bind(this)} />
                            </div>}
                        />

                        {
                            user.isSuperAdmin &&
                            <Tab
                                id={TEMPLATE_TABS.ADMIN}
                                key={TEMPLATE_TABS.ADMIN}
                                title={<span>Admin</span>}
                                panel={<div>

                                    <Loading show={this.state.sending} />

                                    <FormGroup label={'Invite User'}>
                                        <ControlGroup fill={true}>
                                            <TagInput
                                                fill={true}
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

                                        </ControlGroup>
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


                                    <Button text={'Send Invite'} onClick={this.sendInvite.bind(this)} />

                                    {
                                        Object.entries(inviteUrls).map(([email, url]) => <ControlGroup>
                                            <InputGroup readOnly={true} value={email} />
                                            <InputGroup readOnly={true} value={url} />
                                        </ControlGroup>)
                                    }
                                    {/*<FormGroup label='Add Network'>*/}
                                    {/*<ControlGroup>*/}
                                    {/*<InputGroup name='network' placeholder={'Network Name'} value={this.state.networkName} onChange={e => this.setState({networkName: e.target.value})} />*/}
                                    {/*<Button disabled={!this.state.networkName} text={'Add'} onClick={this.addNetwork.bind(this)} />*/}
                                    {/*</ControlGroup>*/}
                                    {/*</FormGroup>*/}
                                </div>}
                            />
                        }

                    </Tabs>
                }


                <div className='buttons margin-top'>

                    <NiceButton
                        text={'Logout'}
                        icon={'sign-out-alt'}
                        href={'/logout'} />
                </div>

                <div className='clear-float' />
            </div>
        )
    }
}

UserForm.propTypes = {}

export default UserForm
