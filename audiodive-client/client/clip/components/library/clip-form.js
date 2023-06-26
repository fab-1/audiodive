import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
    Icon, Intent,
    Navbar,
    Button,
    InputGroup,
    H5, H4, H2,
    AnchorButton,
    Breadcrumbs,
    Label,
    Tag,
    Switch,
    EditableText,
    Tooltip,
    ButtonGroup,
    MenuItem,
    Popover,
    Alert, Menu
} from "@blueprintjs/core"

import Loading from '../shared/loading'
import {Link} from 'react-router-dom'
import {Select} from "@blueprintjs/select/dist/select.bundle"
import {filterGeneric, renderGeneric} from "../../../shared/controls/custom-select"
import UI_TEXT from "../../ui-text"
import RATIOS from '../../../shared/video-ratio'
import axios from 'axios'

import NiceButton from '../../components/shared/nice-button'

const TABS = {
    GENERAL: 'general',
    DETAILS: 'details'
}

const RATIO = {
    WIDE: 'wide',
    SQUARE: 'square',
    VERTICAL: 'vertical'
}


class PreviewComponent extends React.Component {

    constructor() {
        super()

        this.state = {
            confirmDialog: false,
            selectedVersionId: null,
            editMode: false
        }
    }

    deleteVersion() {

        axios.delete(`/admin/api/clip/${this.props.clip.id}/version/${this.state.selectedVersionId}`).
        then(res =>
            this.props.refresh()
        )

        this.setState({saving: true, confirmDialog: false, selectedVersionId: null})
    }

    toggleEdit() {
        this.setState({editMode: !this.state.editMode})
    }

    toggleDelete() {
        this.setState({
            confirmDialog: !this.state.confirmDialog
        })
    }

    versionSelect(version){
        this.setState({
            selectedVersionId: version.id
        })
    }

    updateVersionName(id, name) {
        this.setState({
            editMode: false
        })

        axios.post(`/admin/api/clip/update_version`, {
            name: name,
            id: id
        }).
        then(res => {
            this.props.refresh()
        })
    }

    render() {



        const props = this.props

        const {width, videos, name} = this.props
        let {editMode, selectedVersionId}  = this.state

        if (!selectedVersionId && videos.length)
            selectedVersionId = videos[0].id

        const selectedVersion = selectedVersionId && videos.find(version => version.id === selectedVersionId)

        return <div className='margin-top-10'>

            <Alert
                intent={Intent.DANGER}
                icon="trash"
                isOpen={this.state.confirmDialog}
                onConfirm={this.deleteVersion.bind(this)}
                onCancel={this.toggleDelete.bind(this)}
                cancelButtonText="Cancel"
                confirmButtonText="Delete">
                <p>Would you like to delete the version <strong>{selectedVersion.name}</strong> from the clip <strong>{props.clip.name}</strong>?</p>
            </Alert>

            {
                selectedVersion &&
                <section>
                    <div className='clip-preview'>
                        <Tag intent={Intent.PRIMARY}>{name}</Tag>




                        {
                            selectedVersion.videoUrl?
                                <video height={400} controls={true} poster={selectedVersion.imageUrl} src={selectedVersion.videoUrl} width={width}/>:
                                <div className='no-preview' />
                        }

                        <div className='clip-preview-actions'>
                            {
                                editMode?
                                    <EditableText
                                        isEditing={true}
                                        onConfirm={this.updateVersionName.bind(this, selectedVersion.id)}
                                        intent={Intent.PRIMARY}
                                        defaultValue={selectedVersion.name} />
                                    :
                                    <div className="buttons are-medium">
                                        <a href={selectedVersion.videoUrl} target='_blank' className="button">Video</a>
                                        <a href={selectedVersion.audioUrl} target='_blank' className="button">Download Cover Pic</a>
                                        <a href={selectedVersion.gifUrl} target='_blank' className="button">Download Cover Pic</a>
                                        <Select
                                            noResults={<MenuItem disabled={true} text="No results."/>}
                                            items={props.videos}
                                            itemPredicate={filterGeneric}
                                            itemRenderer={renderGeneric}
                                            onItemSelect={this.versionSelect.bind(this)}>

                                            <Button
                                                rightIcon="caret-down"
                                                text={selectedVersion? selectedVersion.name: 'Select a version'} />

                                        </Select>
                                        <Tooltip content={UI_TEXT.EDIT_VERSION}>
                                            <Button
                                                icon='edit'
                                                onClick={this.toggleEdit.bind(this)}/>
                                        </Tooltip>
                                        <Tooltip content={UI_TEXT.DELETE_VERSION}>
                                            <Button
                                                intent={Intent.DANGER}
                                                icon='trash'
                                                onClick={this.toggleDelete.bind(this)}/>
                                        </Tooltip>
                                        <Popover
                                            content={<Menu>
                                                <li>

                                                </li>
                                                <li>

                                                </li>
                                            </Menu>}
                                        ><Button
                                            text='Download'
                                            intent={Intent.PRIMARY}
                                        /></Popover>
                                    </div>
                            }
                        </div>
                    </div>
                </section>
            }




        </div>
    }
}

class ClipForm extends Component {

    constructor() {
        super()

        this.state = {
            clip: null,
            currentTab: TABS.GENERAL,
            saving: false,
            confirmDialog: false
        }

        //this.updateVersionDebounced = debounce(this.updateVersionName, 1000)
    }

    componentDidMount() {
        //this.loadClip()
        const {user} = this.props

        if (user.isSuperAdmin) {
            axios.get('/admin/api/user/index').
            then(res => {

                this.setState({
                    users: res.data
                })

            })
        }
    }

    loadClip() {
        axios.get('/admin/api/clip/' + this.props.clip.id).
        then(res => {
            this.setState({
                clip: res.data
            })
        })

        // axios.get('/admin/api/creator/index').
        // then(res => {
        //     this.setState({
        //         creators: res.data
        //     })
        // })
    }

    componentDidUpdate(prevProps) {
        if (this.props.clip !== prevProps.clip) {
            //this.loadClip()
        }
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.clip !== this.props.clip) {
            return true
        }

        if (nextProps.clip === this.props.clip && !this.state.clip) {
            return true
        }

        if (this.state.clip !== nextState.clip) {
            return true
        }

        const keys = ['selectedWide', 'selectedSquare', 'selectedVertical', 'editModeSquare', 'editModeWide', 'confirmDialog']
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            if (this.state[key] !== nextState[key]) {
                return true
            }
        }

        return false
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

    saveForm(){

        const {clip} = this.props

        axios.post(`/admin/api/clip/${clip.id}`, {
            clip: clip
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

    cloneClip = () => {
        const {clip} = this.props
        let newRecord = null
        this.setState({saving: true})
        axios.post(`/admin/api/clip/clone/${clip.id}`).
        then(res => {
            newRecord = res.data
            return this.props.refresh()
        }).
        then(res => {
            this.setState({saving: false})
            this.props.openClip(newRecord.id)
        })
    }

    shareClip = async () => {
        const {clip} = this.props
        const res = await navigator.share({
            files: this.sharedFile,
            title: clip.name,
        })
    }

    share = async () => {

        const {clip} = this.props

        if (!navigator.canShare) {
            return
        }

        if (this.sharedFile) {
            return this.shareClip()
        }

        this.setState({
            preparing: true
        })

        let imageResponse = await window.fetch(clip.lastVideo.videoUrl);
        let imageBuffer = await imageResponse.arrayBuffer();
        let fileArray = [new File([imageBuffer], "test.mp4", {
            type: "video/*",
            lastModified: Date.now()
        })];

        this.sharedFile = fileArray

        this.setState({
            preparing: false,
            prepared: true
        })

        // const res = await navigator.share({
        //     files: [file],
        //     title: clip.name,
        //     text: 'Video Created on audiodive.app',
        // })
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

    setPublic = (val) => {

    }

    render() {

        let {creators, showVersion, selectedRatio, users, selectedUser} = this.state
        const {clip, user} = this.props

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



        const formatDate = date => {
            const d = new Date(date)
            const options = { month: 'long', day: 'numeric', year: 'numeric' }
            return d.toLocaleDateString( undefined, options)
        }

        const canEdit = true//user.userClipIds.includes(clip.id)

        //const canEditClip = clip && clip.UserClips.length > 0

        const openWizard = () => {
            this.props.closeSideBar()
            this.props.history.push(`/library/wizard/${clip.id}`)
        }

        return (
            <div className='clip-form'>

                <Loading show={this.state.saving}/>

                <Alert
                    intent={Intent.DANGER}
                    icon="trash"
                    isOpen={this.state.confirmDialog}
                    onConfirm={this.deleteClip.bind(this)}
                    onCancel={this.toggleDelete.bind(this)}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete">
                    <p>Would you like to delete <strong>{clip.name}</strong>?</p>
                </Alert>

                <H4>{clip.name}</H4>
                <H5 className='bp3-text-muted'>{clip.PodcastFeed && clip.PodcastFeed.name}</H5>

                <section className='form-container'>

                    <div className={'clip-preview'}>
                        {
                            clip.lastVideo && clip.lastVideo.videoUrl?
                                <video controls={true} poster={clip.lastVideo.imageUrl} src={clip.lastVideo.videoUrl} />:<div className='no-preview' />
                        }

                    </div>

                        <div className='bu-buttons'>
                            {/*<NiceButton icon='magic' intent={Intent.PRIMARY} onClick={openWizard} text={'Open Wizard'}/>*/}
                            {
                                user.isLoggedIn && <span className={'flex'}>
                                    {/*<NiceButton loading={this.state.preparing} intent={'info'} onClick={this.share} icon='share' text={this.state.prepared? 'Ready to Share':'Share...'}/>*/}


                                    <NiceButton
                                        intent={Intent.PRIMARY}
                                        onClick={e => this.props.history.push(`/transcript/${clip.id}`)}
                                        icon='closed-captioning'
                                        text={'Transcript Editor'}
                                    />
                                    <NiceButton intent={Intent.PRIMARY} onClick={e => this.props.openClip(clip.id)} icon='film' text={'Video Editor'}/>
                                    <NiceButton intent={Intent.NONE} onClick={this.cloneClip} icon='clone' text={'Clone'}/>

                                    {
                                        clip.isOwner &&
                                        <span>
                                            <NiceButton
                                                intent={Intent.DANGER}
                                                icon='trash'
                                                onClick={this.toggleDelete.bind(this)}/>

                                            {/*<Switch checked={clip.isPublic} label="Public" onChange={this.setPublic} />*/}
                                        </span>
                                    }
                                </span>
                            }
                        </div>


                    <div className="bu-buttons">
                        {clip.audioUrl &&  <a href={clip.audioUrl} target='_blank' className="bu-button bu-is-inverted">Audio</a>}
                        {
                            clip.lastVideo && <span>
                                {clip.lastVideo.videoUrl &&  <a href={clip.lastVideo.videoUrl} target='_blank' className="bu-button bu-is-inverted">Video</a>}
                                {clip.lastVideo.imageUrl && <a href={clip.lastVideo.imageUrl} target='_blank' className="bu-button bu-is-inverted">Cover Pic</a>}
                                {clip.lastVideo.gifUrl && <a href={clip.lastVideo.gifUrl} target='_blank' className="bu-button bu-is-inverted">Gif Preview</a>}

                            </span>
                        }

                    </div>


                        {/*<Button  minimal={true}  onClick={this.cloneClip.bind(this)} icon='duplicate' text={'Clone'} />*/}



                    {
                        user.isSuperAdmin && users && <div>
                            <Select
                                noResults={<MenuItem disabled={true} text="No results."/>}
                                items={users}
                                itemPredicate={filterGeneric}
                                itemRenderer={renderGeneric}
                                onItemSelect={selectedUser => this.setState({selectedUser})}>

                                <Button
                                    rightIcon="caret-down"
                                    text={selectedUser? selectedUser.name: 'Select a user'} />

                            </Select>

                            <Button text={'Share'} onClick={this.inviteUser} />
                        </div>
                    }
                    {/*{*/}
                        {/*creators && creators.length &&*/}
                        {/*<ButtonGroup>*/}
                            {/*<Select*/}
                                {/*noResults={<MenuItem disabled={true} text="No results." />}*/}
                                {/*items={creators}*/}
                                {/*itemPredicate={filterGeneric}*/}
                                {/*itemRenderer={renderGeneric}*/}
                                {/*onItemSelect={this.selectCreator.bind(this)}>*/}

                                {/*<Button*/}
                                    {/*rightIcon="caret-down"*/}
                                    {/*text={selectedCreator?selectedCreator.firstName:'Select Creator'}*/}
                                {/*/>*/}
                            {/*</Select>*/}
                            {/*<Button text={'save'} onClick={this.saveForm.bind(this)} />*/}
                        {/*</ButtonGroup>*/}
                    {/*}*/}

                    {
                    }


                    {/*{*/}
                        {/*!!squareVideos.length &&*/}
                        {/*<PreviewComponent*/}
                            {/*videos={squareVideos}*/}
                            {/*name={'Square'}*/}
                            {/*width={512}*/}
                            {/*clip={clip}*/}
                            {/*refresh={this.loadClip.bind(this)}*/}
                        {/*/>*/}
                    {/*}*/}

                    {/*{*/}
                        {/*!!verticalVideos.length &&*/}
                        {/*<PreviewComponent*/}
                            {/*videos={verticalVideos}*/}
                            {/*name={'Vertical'}*/}
                            {/*width={512}*/}
                            {/*clip={clip}*/}
                            {/*refresh={this.loadClip.bind(this)}*/}
                        {/*/>*/}
                    {/*}*/}

                    {/*{*/}
                        {/*!!wideVideos.length &&*/}
                        {/*<PreviewComponent*/}
                            {/*videos={wideVideos}*/}
                            {/*name={'Wide'}*/}
                            {/*width={720}*/}
                            {/*clip={clip}*/}
                            {/*refresh={this.loadClip.bind(this)}*/}
                        {/*/>*/}
                    {/*}*/}

                </section>


            </div>
        )
    }
}

ClipForm.propTypes = {}

export default ClipForm
