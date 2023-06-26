import React from 'react'
import ReactDom from 'react-dom'
import FeedForm from './library/feed-form'
import ClipForm from './library/clip-form'
import ClipSideBar from './clip-side-bar'
import {
    Icon, Breadcrumb,
    Button,Alignment,
    Spinner, ButtonGroup,Navbar, Tooltip, NavbarGroup,
    Tree, Dialog, Intent, Card, H5, Popover, Select, H2, H3
} from "@blueprintjs/core"
import Icons from '../../shared/custom-icons'
import AlbumsList from './shared/album-list'
import debounce from 'lodash/debounce'
import Loading from "./shared/loading"
import UI_TEXT from '../ui-text'
import axios from 'axios'
import ClipWizard from "./clip-wizard"
import FeedPage from './library/feed-page'
import CustomIcons from '../../shared/custom-icons'
import EpisodeForm from "./library/episode-form"
import NiceButton from "./shared/nice-button"
import '../sass/library.scss';


const TYPE = {
    FEED: 'feed',
    CLIP: 'clip',
    EPISODE: 'episode'
}

const GROUP = {
    RECENT: 'recent',
    HOME: 'home',
    FEED: 'feed'
}

const DEFAULT_STATE = {
    remotePodcasts: [],
    clips: [],
    feedNodesExpanded: {},
    selectedClipId: null,
    selectedFeedId: null,
    selectedType: null,
    loading: false
}


// const PersistentComponent = withStorage(
//     React.Component,
//     'ClipManagerPanel',
//     ['clips', 'redirect', 'selectedClipId', 'selectedFeedId', 'selectedType', 'remotePodcasts'],
//     DEFAULT_STATE
// )

class Library extends React.Component {

    constructor() {
        super()

        this.state = this.state || DEFAULT_STATE
        //this.setBindings()
    }

    componentDidMount() {

        const {entityType, entityId} = this.props.match.params

        if (entityType === 'myclips' && entityId ) {
            this.setState({selectedClipId: entityId})
        }
    }

    onClipDeleted = () => {

        this.setState({
            selectedType: null,
            selectedFeedId: null,
            selectedClipId: null
        }, () => {
            this.props.refresh()
        })

    }

    closeSideBar = () => {
        this.setState({selectedClipId: null, episode: null  })
        //this.props.history.push('/library')
    }

    render(){

        const {selectedType, selectedFeedId, showPodcastImport, remotePodcasts, selectedClipId, episode} = this.state
        const {feedsById, clipsById, clips, feeds, match, history, myClips,
            refresh, user, userPlan, templates, updateTemplates, showMenu, libraryTemplates} = this.props

        //const selectedFeed = feedsById && feedsById[selectedFeedId]

        const {entityType, entityId} = match.params
        //const selectedClipId = entityType === 'clip' && match.params.entityId
        const selectedClip = selectedClipId && clipsById[selectedClipId]
        // if (selectedClipId && !selectedClip) {
        //     return <Card className='error-card' elevation={1}>
        //         <H5>Clip no found</H5>
        //         <p>We could not find this clip. It was probably deleted. Sorry.</p>
        //     </Card>
        // }

        // let coverStyle = {}
        // if (selectedType === TYPE.FEED && selectedFeed) {
        //     coverStyle.backgroundImage = 'url(' +selectedFeed.resizedImage+ ')'
        // }
        //
        // if (selectedType === TYPE.CLIP && selectedClip) {
        //     //coverStyle.backgroundImage = 'url(' +feedsById[selectedClip.PodcastFeedId].resizedImage+ ')'
        // }

        const openClip = id => {
            history.push('/clip/' + id)
            this.closeSideBar()
        }

        const selectClip = clip => {

            this.setState({selectedClipId: clip.id})
            // if (selectedClip && selectedClip.id === clip.id) {
            //     history.push('/library')
            // }
            // else {
            //     history.push(`/library/clip/${clip.id}`)
            // }
        }

        const selectTemplate = template => {

        }

        //const sidebarOpened = match.path !== '/library'

        const wizardOpen = entityType === 'wizard'
        const sideBarOpened = ['clip'].includes(entityType) || episode

        const isHome = !entityType || entityType === 'clip'



        const feedForm = entityType === 'feed'
        const selectedFeed = feedForm && entityId && feedsById && feedsById[entityId]


        return <div className=''>


            {/*{*/}
            {/*feeds && <AlbumsList*/}
            {/*noSelected={true}*/}
            {/*inset={true}*/}
            {/*label={'Subscribed Shows'}*/}
            {/*list={feeds}*/}
            {/*onItemSelect={feed => history.push(`/library/feed/${feed.id}`)}*/}
            {/*newItem={<Button minimal={true}*/}
            {/*intent={Intent.PRIMARY}*/}
            {/*className='album-add-item album-item'*/}
            {/*onClick={_ => this.props.togglePodcastImport()}*/}
            {/*icon={CustomIcons.podcastIcon} text={'Find/Add Podcast'}/>}*/}
            {/*/>*/}
            {/*}*/}

            {
                !user.isLoggedIn && match.url === '/library' && <section className="bu-hero bu-is-link">
                    <div className="bu-hero-body">
                        <div className="bu-container">
                            <h1 className="bu-title">
                                Make your voice heard and seen!
                            </h1>
                            <h2 className="bu-subtitle">
                                Create cool videos from your podcast or music, and share it with the world.
                            </h2>
                            <ul className='bu-is-size-6'>
                                <li>Design your video by drag and dropping images, text, GIFs, sound visualizer and more.</li>
                                <li>Co-create with your friends by sharing your clips and video designs and inviting them to collaborate.</li>
                                <li>Export your videos and share them everywhere!</li>
                            </ul>
                        </div>
                    </div>
                </section>
            }

            {/* + (sideBarOpened ? 'shifted' : '')>*/}

            {
                <div className={'content-editor bu-container'}>

                    {
                        wizardOpen && feeds && templates && libraryTemplates && <ClipWizard
                            key={match.params.entityId}
                            history={history}
                            clipId={match.params.entityId}
                            updateTemplates={updateTemplates}
                            showWizard={wizardOpen}
                            onWizardClose={_ => {
                                history.push('/library')
                                this.props.refresh()
                            }}
                            shows={feeds}
                            feedsById={feedsById}
                            openClip={openClip}
                            userPlan={userPlan}
                            inviteStep={match.params.tab === 'invite'}
                            showMenu={showMenu}
                            libraryTemplates={libraryTemplates}
                            userTemplates={templates}
                        />
                    }


                    {
                        isHome && <div>


                            {
                                myClips && <AlbumsList
                                    inset={true}
                                    activeAlbum={selectedClip}
                                    label={'My Clips'}
                                    list={myClips.slice(0, 5)}
                                    onItemSelect={selectClip}
                                    newItem={<div className='bu-column bu-is-12' style={{width:'100%'}}>
                                        <NiceButton
                                            intent={Intent.PRIMARY}
                                            minimal={true}
                                            onClick={e => this.props.history.push('/library/myclips')}
                                            text={`See all ${myClips.length} clips`}
                                    /></div>}
                                />
                            }

                            {/*<AlbumsList*/}
                                {/*inset={true}*/}
                                {/*activeAlbum={selectedClip}*/}
                                {/*label={'Sample Clips'}*/}
                                {/*list={clips.slice(0, 10)}*/}
                                {/*onItemSelect={selectClip}*/}
                                {/*newItem={<div className='bu-column bu-is-12' style={{width:'100%'}}>*/}
                                    {/*<NiceButton*/}
                                        {/*intent={Intent.PRIMARY}*/}
                                        {/*minimal={true}*/}
                                        {/*onClick={e => this.props.history.push('/library/sampleclips')}*/}
                                        {/*text={`See all ${clips.length} clips`}*/}
                                    {/*/>*/}
                                {/*</div>}*/}
                            {/*/>*/}
                        </div>
                    }

                    {
                        entityType === 'myclips' && myClips && <div>
                            <AlbumsList
                                inset={true}
                                activeAlbum={selectedClip}
                                label={'My Clips'}
                                list={myClips}
                                onItemSelect={selectClip}
                            />
                            <NiceButton
                                intent={Intent.PRIMARY}
                                minimal={true}
                                onClick={e => this.props.history.push('/library/myclips?page=2')}
                                text={`Next Page`} />
                        </div>
                    }


                    {
                        entityType === 'sampleclips' && clips && <AlbumsList
                            inset={true}
                            activeAlbum={selectedClip}
                            label={'Sample Clips'}
                            list={clips}
                            onItemSelect={selectClip}
                        />
                    }

                    {
                        entityType === 'templates' && libraryTemplates && <AlbumsList
                            inset={true}
                            activeAlbum={selectedClip}
                            label={'Library Templates'}
                            list={libraryTemplates}
                            onItemSelect={selectTemplate}
                            canDelete={t => t.UserTemplates && t.UserTemplates.length > 0}
                            handleDelete={templateId => axios.delete('/admin/api/template/' + templateId)}
                            handleOpen={templateId => history.push('/clip/1/template/'+templateId)}
                            //handleAction={templateId => axios.get('/admin/api/template/capture/' + templateId)}
                        />
                    }

                    {
                        entityType === 'templates' && myClips && <AlbumsList
                            inset={true}
                            activeAlbum={selectedClip}
                            label={'Your Templates'}
                            list={templates}
                            onItemSelect={selectTemplate}
                            canDelete={template => template.UserTemplates && template.UserTemplates.length > 0}
                            handleDelete={templateId => axios.delete('/admin/api/template/' + templateId)}
                            handleAction={templateId => axios.get('/admin/api/template/capture/' + templateId)}
                            handleOpen={templateId => history.push('/clip/1/template/'+templateId)}
                        />
                    }


                    {
                        feedForm && selectedFeed && <FeedPage
                            id={selectedFeed.id}
                            selectedFeed={selectedFeed}
                            history={history}
                            match={match}
                            onEpisodeSelected={episode => this.setState({episode})}
                        />
                    }


                    {
                        ReactDom.createPortal(
                            <ClipSideBar
                                stickToTop={true}
                                onClose={this.closeSideBar}
                                open={selectedClip}
                                items={[<div>
                                    {
                                        selectedClip && <ClipForm
                                            user={user}
                                            clip={selectedClip}
                                            history={history}
                                            match={match}
                                            openClip={openClip}
                                            closeSideBar={this.closeSideBar}
                                            refresh={refresh}
                                            onClipDeleted={this.onClipDeleted}
                                        />
                                    }

                                    {
                                        episode && <EpisodeForm
                                            episode={episode}
                                            feedId={selectedFeed.id}
                                            history={history}
                                            match={match}
                                        />
                                    }

                                </div>]}
                            />, document.querySelector('.sidebar-portal'))
                    }


                </div>
            }

        </div>
    }

}

export default Library