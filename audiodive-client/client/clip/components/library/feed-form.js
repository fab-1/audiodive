import React from 'react'
import PropTypes from 'prop-types'
import {
    Icon, Intent,
    Button,
    ButtonGroup,
    Popover,
    Classes,
    Position,
    Alignment,
    MenuItem,
    NavbarGroup,
    FormGroup,
    Switch,
    TextArea,
    Tabs,
    Alert,
    Menu,
    Navbar,
    NavbarDivider,
    H4,
    Toaster
} from "@blueprintjs/core"

import axios from 'axios'
import EpisodeForm from './episode-form'
import CustomIcons from '../../../shared/custom-icons'
import AlbumsList from "../shared/album-list"

const TABS = {
    EPISODES: 'episodes',
    DETAILS: 'details'
}
const AppToaster = Toaster.create({
    className: "notifications",
    position: Position.TOP_RIGHT
})
class FeedForm extends React.Component {

    constructor() {
        super()

        this.state = {
            feed: null,
            selectedEpisode: null,
            currentTab: TABS.EPISODES
        }

        console.log('feedform')
    }

    componentDidMount() {

        const {feed} = this.props

        // this.setState({
        //     feed: feed
        // })

        this.loadFeed(feed.id)
    }

    loadFeed(id) {

        this.setState({
            selectedEpisode: null
        })

        axios.get('/admin/api/feed/' + id).
        then(res => {

            const {episodeId} = this.props.match.params
            let selected = null
            if (episodeId) {
                selected = res.data.episodes.find(episode => episode.id === parseInt(episodeId, 10))
            }


            this.setState({
                feed: res.data,
                selectedEpisode: selected
            })
        })
    }

    syncFeed(){
        axios.post('/admin/api/feed/sync_feed', {
            feed_id: this.state.feed.id
        }).
        then(res => {
            AppToaster.show({
                message: res.data.message
            })
        })
    }

    saveForm(){

        const { id, googleUrl, itunesUrl, autoRefresh } = this.state.feed

        axios.post('/admin/api/feed', {id, googleUrl, itunesUrl, autoRefresh}).
        then(res => {
            AppToaster.show({
                message: 'Feed details saved!'
            })
        })
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.feed !== this.props.feed) {
            console.log('loading new feed')
            this.loadFeed(this.props.feed.id)
        }
    }

    datafieldChange(key, value) {

        const state2 = update(this.state, {
            feed : {
                extraData : {
                    [key]: {$set: value}
                }
            }
        })

        this.setState(state2)
    }


    valueChange(key, value) {
        this.setState(
            update(
                this.state,
                {feed: {[key]: {$set: value}}}
            )
        )
    }

    handleValueChange(episode) {
        const {feed, selectedEpisode} = this.state
        this.props.history.push(`/library/feed/${feed.id}/${episode.id}`)
    }

    handleTabChange(tab) {
        this.setState({currentTab: tab})
    }

    newClip(){
        const {history, match} = this.props
        history.push(`${match.url}/newclip`)
    }

    onAudioClipUpload(event) {
        const {feed} = this.state
        const {history, match} = this.props
        const {episodeId} = match.params
        const selectedEpisode = feed.episodes.find(episode => episode.id === parseInt(episodeId, 10))

        const formData = new FormData()
        formData.append("imageData", event.target.files[0]);
        axios.post(`/admin/api/file/data_upload`, formData).
        then(res => {

            const clipObject = {
                name: res.data.fileName,
                start: 0,
                end: 0,
                totalDuration: 10,
                PodcastFeedId: feed.id,
                PodcastId: selectedEpisode?selectedEpisode.id:null,
                audioUrl: res.data.file
            }

            axios.post(`/admin/api/clip`, {
                clip: clipObject
            }).
            then(res => {
                history.push('/library')
                AppToaster.show({
                    message: 'Transcript task scheduled',
                    icon: 'manually-entered-data'
                })
            }).
            catch(e => console.error(e))

        })
    }

    deleteFeed() {
        const {feed} = this.state
        axios.delete('/admin/api/feed/'+feed.id).
        then(e => {
            this.props.refresh()
            this.props.history.push('/library')
            this.setState({confirmDialog: false})
        })
    }

    toggleDelete() {
        this.setState({
            confirmDialog: !this.state.confirmDialog
        })
    }

    render() {

        const {action, episodeId} = this.props.match.params
        const {feed, currentTab} = this.state

        if (!feed) {
            return <div />
        }

        const episodes = feed.Podcasts

        const selectedEpisode = feed.episodes.find(episode => episode.id === parseInt(episodeId, 10))

        //console.log(CustomIcons.podcastIcon)

        const newclip = action === 'newclip'

        return (
            <div className='feed-form'>


                <Alert
                    intent={Intent.DANGER}
                    icon="trash"
                    isOpen={this.state.confirmDialog}
                    onConfirm={this.deleteFeed.bind(this)}
                    onCancel={this.toggleDelete.bind(this)}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete">
                    <p>Would you like to delete <strong>{feed.name}</strong>?</p>
                </Alert>

                {/*<h4>*/}
                    {/*<span className={'feed-title-icon'}><Icon icon={CustomIcons.podcastIcon} /></span>*/}
                    {/*{feed.name}*/}
                {/*</h4>*/}

                {/*<Suggest*/}
                    {/*inputProps={{*/}
                        {/*value: selectedEpisode?selectedEpisode.title:'',*/}
                        {/*leftIcon: 'search',*/}
                        {/*className: 'bp3-minimal',*/}
                        {/*placeholder: 'Search Episodes',*/}
                    {/*}}*/}
                    {/*popoverProps={{minimal: true}}*/}
                    {/*//ref={suggest => suggest && suggest.setState({})}*/}
                    {/*className={'episode-list'}*/}
                    {/*itemPredicate={filterEpisode}*/}
                    {/*itemRenderer={renderEpisode}*/}
                    {/*inputValueRenderer={v => v.title}*/}
                    {/*noResults={<MenuItem disabled={true} text="No results." />}*/}
                    {/*onItemSelect={this.handleValueChange.bind(this)}*/}
                    {/*items={episodes}>*/}
                {/*</Suggest>*/}

                <H4>{feed.name}</H4>
                <Navbar className='navbar-mini'>

                    <NavbarGroup >
                        <Button
                            small={true}
                            minimal={true}
                            onClick={this.handleTabChange.bind(this, TABS.EPISODES)}
                            intent={Intent.PRIMARY} active={currentTab === TABS.EPISODES}
                            icon={CustomIcons.episodeIcon}
                            text={'Episodes'}
                        />
                        <NavbarDivider/>
                        <Button
                            small={true}
                            minimal={true}
                            onClick={this.handleTabChange.bind(this, TABS.DETAILS)}
                            intent={Intent.PRIMARY} active={currentTab === TABS.DETAILS}
                            icon='edit'
                            text={'Details'} />
                    </NavbarGroup>

                    <NavbarGroup align={Alignment.RIGHT}>
                        <Popover
                            position={Position.BOTTOM}
                            content={
                                <Menu>
                                    <MenuItem
                                        text="Cut from episode"
                                        disabled={!selectedEpisode || newclip}
                                        icon={'cut'}
                                        onClick={this.newClip.bind(this)}
                                    />
                                    <li>
                                        <label className="bp3-menu-item bp3-fill bp3-icon-upload">
                                            Upload File
                                            <input
                                                type="file"
                                                hidden
                                                onChange={this.onAudioClipUpload.bind(this)}
                                            />
                                        </label>
                                    </li>
                                </Menu>
                            }>
                            <Button
                                small={true}
                                icon={'film'}
                                text={'New Clip'}
                                rightIcon={'caret-down'}
                                intent={Intent.PRIMARY}
                            />
                        </Popover>
                        <NavbarDivider/>

                        <Button small={true} text='Sync with rss feed' icon='refresh' onClick={this.syncFeed.bind(this)} />
                        <NavbarDivider/>
                        <Button small={true} intent={Intent.DANGER} text='Delete' icon='trash' onClick={this.toggleDelete.bind(this)} />


                    </NavbarGroup>

                </Navbar>

                {
                    currentTab === TABS.EPISODES &&
                    <div>
                        {
                            feed.episodes &&
                            <AlbumsList
                                activeAlbum={selectedEpisode}
                                list={feed.episodes}
                                onItemSelect={this.handleValueChange.bind(this)}
                            />
                        }

                        {
                            selectedEpisode &&
                            <EpisodeForm
                                showClipCutter={newclip}
                                history={this.props.history}
                                match={this.props.match}
                                episode={selectedEpisode}
                            />
                        }
                    </div>
                }

                {
                    currentTab === TABS.DETAILS &&
                    <div className='feed-detail'>

                        <Switch
                            onChange={e => this.valueChange('autoRefresh', e.target.value === 'on')}
                            checked={feed.autoRefresh}
                            label={'Auto Sync Feed'}
                            type="checkbox"/>

                        <FormGroup
                            label="Google URL"
                            labelFor="googleUrl"
                            requiredLabel={false}>
                            <input
                                name={'googleUrl'}
                                type="text"
                                className="bp3-input"
                                value={feed.googleUrl}
                                onChange={event => this.valueChange('googleUrl', event.target.value)}
                            />
                        </FormGroup>

                        <FormGroup
                            label="Itunes URL"
                            labelFor="itunesUrl"
                            requiredLabel={false}>
                            <input
                                name={'itunesUrl'}
                                type="text"
                                className="bp3-input"
                                value={feed.itunesUrl}
                                onChange={event => this.valueChange('itunesUrl', event.target.value)}
                            />
                        </FormGroup>

                        <FormGroup
                            label="RSS URL"
                            labelFor="itunesUrl"
                            requiredLabel={false}>
                            <input
                                name={'rssFeedUrl'}
                                type="text"
                                className="bp3-input"
                                value={feed.rssFeedUrl}
                                onChange={event => this.valueChange('rssFeedUrl', event.target.value)}
                            />
                        </FormGroup>

                        <FormGroup
                            label="Description"
                            labelFor="description"
                            requiredLabel={false}>
                                    <TextArea
                                        name={'description'}
                                        value={feed.extraData.description}
                                        onChange={(event) => this.datafieldChange('description', event.target.value)}
                                        rows="4"
                                    />
                        </FormGroup>

                        <FormGroup
                            label="Biography"
                            labelFor="bio"
                            requiredLabel={false}>

                                    <TextArea
                                        name={'bio'}
                                        value={feed.extraData.bio}
                                        onChange={(event) => this.datafieldChange('bio', event.target.value)}
                                        rows="4" />
                        </FormGroup>

                        <Button intent={Intent.PRIMARY} onClick={this.saveForm.bind(this)} text='Save' icon='floppy' />
                    </div>
                }
            </div>
        )
    }
}

FeedForm.propTypes = {}

export default FeedForm
