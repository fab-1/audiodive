import React, {Component} from 'react'
import debounce from 'lodash/debounce'
import PropTypes from 'prop-types'
import {
    Icon, Intent,
    Navbar,
    Dialog,
    InputGroup,
    H4, H3, H2,
    AnchorButton,
    Breadcrumbs,
    Label,
    Tag,
    FormGroup,
    EditableText,
    Tooltip,
    ButtonGroup,
    MenuItem,
    Popover,
    Alert, Menu
} from "@blueprintjs/core"

import StripeCheckout from '../stripe-checkout'
import Loading from '../shared/loading'
import axios from 'axios'

import NiceButton from '../../components/shared/nice-button'
import UserLoginSignup from "../user-login-signup"

const TABS = {
    GENERAL: 'general',
    DETAILS: 'details'
}


class VideoPage extends Component {

    constructor() {
        super()

        this.state = {
            clip: null,
            currentTab: TABS.GENERAL,
            saving: false,
            confirmDialog: false,
            donation: 5,
            updatingBilling: false,
        }

        //this.updateVersionDebounced = debounce(this.updateVersionName, 1000)
    }

    componentDidMount() {
        //this.loadClip()
        const {user} = this.props

        //this.loadAccess()
        this.loadClip()

        // if (user.isSuperAdmin) {
        //     axios.get('/admin/api/user/index').
        //     then(res => {
        //
        //         this.setState({
        //             users: res.data
        //         })
        //
        //     })
        // }

        this.updateVersionDebounced = debounce(this.saveForm, 1000)
    }

    async loadAccess(){
        const {clip} = this.props
        const res = await axios.get('/admin/api/clip/'+ clip.id + '/access')
        this.setState({
            access: res.data
        })
    }

    async loadClip(){
        const {clip} = this.props
        //this.setState({saving: true})
        const res = await axios.get('/admin/api/clip/'+ clip.id)
        this.setState({
            clip: res.data
        })
        return Promise.resolve(res)
        //this.setState({saving: false})
    }

    // loadClip() {
    //
    //
    //     axios.get('/admin/api/clip/' + this.props.clip.id).
    //     then(res => {
    //         this.setState({
    //             clip: res.data
    //         })
    //     })
    //
    //     // axios.get('/admin/api/creator/index').
    //     // then(res => {
    //     //     this.setState({
    //     //         creators: res.data
    //     //     })
    //     // })
    // }

    componentDidUpdate(prevProps) {
        if (this.props.clip !== prevProps.clip) {
            //this.loadClip()
        }
    }

    handleTabChange(tab) {
        this.setState({currentTab: tab})
    }

    valueChange(value, key) {
        console.log(value, key)
    }

    versionSelect(type, version){
        this.setState({
            [type]: version
        })


    }

    updateField(key, e) {

        const {clip} = this.state
        clip[key] = e.target.value

        this.setState({clip})
    }

    saveForm = () => {

        const {clip} = this.state

        axios.put(`/admin/api/clip/${clip.id}`, {
            ...clip
        })
    }

    toggleDelete() {
        this.setState({
            confirmDialog: !this.state.confirmDialog
        })
    }

    deleteClip() {

        const {clip} = this.props

        this.setState({saving: true, confirmDialog: false})
        axios.delete(`/admin/api/clip/${clip.id}`).
        then(res => this.props.onClipDeleted())
    }

    cloneClip() {
        let newRecord = null
        this.setState({saving: true})
        axios.post(`/admin/api/clip/clone/${this.state.clip.id}`).
        then(res => {
            newRecord = res.data
            return this.props.refresh()
        }).
        then(res => {
            this.setState({saving: false})
            this.props.history.push('/library/clip/'+ newRecord.id)
        })
    }



    selectCreator(creator) {
        this.setState({
            clip: update(this.state.clip, {
                CreatorId: {$set: creator.id}
            })
        })
    }

    inviteUser = () => {

        const {clip} = this.props
        const {selectedUser} = this.state

        axios.post('/admin/api/clip/share', {
            UserId: selectedUser.id,
            ClipId: clip.id
        })
    }

    closeSideBar = () => {
        this.setState({selectedClipId: null, episode: null  })
        //this.props.history.push('/library')
    }

    addPayment = async () => {
        const { user } = this.props
        const result = await StripeCheckout(user.email)
        if (result) {
            this.setState({updatingBilling: true})
            await axios.put('/api/v1/account/update-billing-card', result)
            await this.props.loadUser()
            this.setState({updatingBilling: false})
        }
    }

    purchaseClip = async () => {

        const { donation, clip } = this.state

        this.setState({
            buying: true
        })

        try {
            const res = await axios.post('/admin/api/clip/' + clip.id + '/purchase', {
                donation
            })

            await this.loadClip()
        }
        catch(e) {

        }

        this.setState({
            buying: false,
            confirmDialog: false
        })

    }

    onDescriptionChange = (description) => {
        let {clip} = this.state
        let metaData = clip.metaData || {}
        metaData.description = description
        clip.metaData = metaData
        this.setState({clip})
        this.updateVersionDebounced()
    }

    deleteClip() {

    }

    toggleConfirm(){
        this.setState({confirmDialog: !this.state.confirmDialog})
    }

    setDonation(donation) {
        this.setState({donation})
    }

    buyClip() {

    }

    onLoginSuccess = () => {
        this.props.loadUser()
    }

    render() {

        console.log('rendering ')

        const {user} = this.props
        let {creators, showBilling, updatingBilling, confirmDialog, clip, donation} = this.state

        if (!clip) {
            clip = this.props.clip
        }

        const selectedCreator = clip && creators && creators.find(creator => creator.id === clip.CreatorId)

        if (!clip) {
            return <Loading when={true} />
        }

        // const squareVideos = clip.ClipVideos.filter(video => video.ratio === RATIO.SQUARE)
        //                                     .sort((a, b) => (a.updatedAt <= b.updatedAt? 1: -1))
        //
        // const wideVideos = clip.ClipVideos.filter(video => video.ratio === RATIO.WIDE)
        //                                     .sort((a, b) => (a.updatedAt <= b.updatedAt? 1: -1))
        //
        // const verticalVideos = clip.ClipVideos.filter(video => video.ratio === RATIO.VERTICAL)
        //                                     .sort((a, b) => (a.updatedAt <= b.updatedAt? 1: -1))


        const description = clip.metaData? clip.metaData.description:''

        const formatDate = date => {
            const d = new Date(date)
            const options = { month: 'long', day: 'numeric', year: 'numeric' }
            return d.toLocaleDateString( undefined, options)
        }

        const canEdit = clip && (clip.isEditor || clip.isOwner)

        return (
            <div className='clip-form'>

                <Dialog

                    onClose={this.handleClose}
                    isOpen={confirmDialog}
                >
                    <div className={'bp3-dialog-body'}>

                        <Loading show={this.state.buying || updatingBilling}/>

                        {
                            confirmDialog && <div className='content is-medium'>

                                {
                                    !user.isLoggedIn && <div>

                                        <UserLoginSignup
                                            onClose={() => {}}
                                            onSuccess={this.onLoginSuccess}
                                        />

                                    </div>
                                }

                                {
                                    user.isLoggedIn && user.hasBilling && <div>
                                        <p className='margin-bottom'>Are you ready to unlock <strong>{clip.name}</strong> for <strong>${donation}</strong>?</p>

                                        <div className="is-divider"></div>

                                        <div className={'buttons is-centered'}>
                                            <NiceButton large={true} onClick={this.toggleDelete.bind(this)} text={'Cancel'} />
                                            <NiceButton large={true} intent={'primary'} onClick={this.purchaseClip} text={'Buy'} />
                                        </div>
                                    </div>
                                }

                                {
                                    user.isLoggedIn && !user.hasBilling && <div>
                                        <p className='margin-bottom'>You need to add your payment info first</p>

                                        <div className={'buttons is-centered'}>
                                            <NiceButton onClick={this.toggleDelete.bind(this)} text={'Cancel'} />
                                            <NiceButton intent={'primary'} onClick={this.addPayment} text={'Add Payment Info'} />
                                        </div>
                                    </div>
                                }

                            </div>
                        }
                    </div>
                </Dialog>

                <Alert
                    intent={Intent.DANGER}
                    icon="trash"
                    isOpen={false}
                    onConfirm={this.deleteClip.bind(this)}
                    onCancel={this.toggleDelete.bind(this)}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete">
                    <p>Would you like to purchase <strong>{clip.name}</strong>?</p>
                </Alert>


                <Loading show={this.state.saving}/>

                {
                    clip.videoUrl && <video className='margin-bottom' height={400} controls={true} src={clip.videoUrl} />
                }


                {
                    !clip.videoUrl && <img className='margin-bottom' height={400} src={clip.imageUrl} />
                }


                <H3>{clip.name}</H3>
                <H4>{formatDate(clip.createdAt)}</H4>

                <p className='content margin-top'>
                    {
                        canEdit &&
                        <EditableText
                            intent={Intent.PRIMARY}
                            maxLength={400}
                            maxLines={12}
                            minLines={3}
                            multiline={true}
                            placeholder="Put Description here"
                            value={description}
                            onChange={this.onDescriptionChange}
                        />
                    }
                    {
                        !canEdit && description
                    }
                </p>

                {
                    this.state.clip && clip.isPremium && !canEdit && !clip.isPurchaser && (
                        <div>
                            <div className='margin-top flex space-between'>

                                <label>Donate</label>

                                <div className="buttons has-addons">
                                    <NiceButton
                                        onClick={() => this.setDonation(3)}
                                        text={'$3'}
                                        intent={donation === 3?'info':null}
                                    />
                                     <NiceButton
                                        onClick={() => this.setDonation(5)}
                                        text={'$5'}
                                        intent={donation === 5?'info':null}
                                     />
                                     <NiceButton
                                        onClick={() => this.setDonation(8)}
                                        text={'$8'}
                                        intent={donation === 8?'info':null}
                                     />
                                </div>

                                <label>custom $</label>

                                <div className="field">
                                    <div className="control">
                                        <input style={{width:'50px'}} value={donation} onChange={e => this.setDonation(e.target.value)} className="input is-info" type="number" min={3} placeholder="Custom Amount" />
                                    </div>
                                </div>
                            </div>

                            <div className={'text-center'}>
                                <NiceButton
                                    large={true}
                                    className={''}
                                    onClick={() => this.toggleConfirm()}
                                    text={'Unlock This Class for $' + donation} intent={'info'} icon={'dollar-sign'} />

                            </div>

                            <div className="is-divider" data-content="OR"></div>

                            <div className={'text-center'}>
                            <NiceButton
                                large={true}
                                onClick={() => this.toggleConfirm()}
                                text={'Subscribe for $22/month'} intent={'success'} />
                            <p className='content is-small'>Get unlimited access to all courses</p>
                            </div>


                        </div>
                    )
                }


            </div>
        )
    }
}

VideoPage.propTypes = {}

export default VideoPage
