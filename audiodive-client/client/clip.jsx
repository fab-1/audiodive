import './clip/sass/index.scss'
import { save, load } from "redux-localstorage-simple"

import React from 'react'
import ReactDOM from 'react-dom'
import CustomIcons from './shared/custom-icons'
import {FocusStyleManager, FormGroup, MenuItem} from "@blueprintjs/core";
import update from 'immutability-helper';
import axios from 'axios'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import { createLogger } from 'redux-logger'
import { combineReducers } from 'redux'
import undoable, { includeAction, excludeAction, ActionTypes } from 'redux-undo'
import ClipEditor from './clip/components/clip-editor.jsx'
import Library from './clip/components/library.js'
import GettingStarted from './pages/getting'
import findIndex from 'lodash/findIndex'
import NavigationBar from './shared/navigation'
import NiceButton from './clip/components/shared/nice-button'
import PodcastSearch from './clip/components/podcast-import'
import UserProfile from './clip/components/user-profile'
import HomeDataComponent from './clip/extensible-components/HomeDataComponent'
import {
    Card, Intent,
    H4, H5, H3,
    Alert,
    Button,
    Dialog,
    Popover,
    Classes,
    Position,
    Drawer,
    Tooltip,
    NavbarGroup,
    Menu,
    Breadcrumb,
    MenuDivider
} from "@blueprintjs/core"

import Page from './page'
import {BrowserRouter as Router, Route, Redirect} from 'react-router-dom'
import UI_TEXT from './clip/ui-text'
import clipReducer from './clip/reducers/clip-reducer'
import userReducer from './clip/reducers/user-reducer'
import templateReducer from './clip/reducers/template-reducer'
import {RECEIVE_CLIP, SAVED_CLIP, FETCHING_CLIP, SAVING_CLIP, ALL_CLIP_ACTIONS, UNDO_CLIP, REDO_CLIP} from './clip/actions/clip-actions'
import {RECEIVE_TEMPLATE, SAVED_TEMPLATE, FETCHING_TEMPLATE, SAVING_TEMPLATE, UNDO_TEMPLATE, REDO_TEMPLATE} from './clip/actions/template-actions'
import withStorage from "./clip/components/shared/with-storage"
import UserLoginSignup from "./clip/components/user-login-signup"
import Transcript from "./clip/components/Transcript"

FocusStyleManager.onlyShowFocusOnTabs()
Tooltip.defaultProps.hoverOpenDelay = 500;
Tooltip.defaultProps.position = Position.BOTTOM;

const defaultHeaders = {
    'X-CSRF-TOKEN' : window.csrf
}

axios.defaults.headers.post = defaultHeaders
axios.defaults.headers.put = defaultHeaders
axios.defaults.headers.delete = defaultHeaders
axios.defaults.headers.patch = defaultHeaders

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

const SECTIONS = {
    CLIP: '/clip',
    TRANSCRIPT: 'transcript',
    LAYOUT: '/template',
    FILES: '/library',
    WIZARD: '/library/wizard'
}


const loggerMiddleware = createLogger()

const clip = undoable(
    clipReducer,
    {
        filter: (action, currentState, previousHistory) => {

            if ([SAVED_CLIP, RECEIVE_CLIP, FETCHING_CLIP].includes(action.type)) {
                return false
            }

            return true
        },
        undoType: UNDO_CLIP,
        redoType: REDO_CLIP,
        limit: 10
    })

const template = undoable(
    templateReducer(),
    {
        filter: (action, currentState, previousHistory) => {

            if ([SAVED_TEMPLATE, FETCHING_TEMPLATE].includes(action.type)) {
                return false
            }

            // if (ALL_CLIP_ACTIONS.includes(action.type)) {
            //     return false
            // }


            return true
        },
        undoType: UNDO_TEMPLATE,
        redoType: REDO_TEMPLATE,
        limit: 10
    })

let middlewares = [
    thunkMiddleware,
]

if (process.env.NODE_ENV === 'development') {
    middlewares.push(loggerMiddleware)
}
else {
    //import('console-log-div').then((something) => {});
}


const clipStore = createStore(
    combineReducers({
        clip,
        template,
        user: userReducer,
        readOnlyTemplate: templateReducer('READONLY')
    }),
    applyMiddleware(...middlewares)
)


const GlobalMenu = props => {

    const entityType = props.match.params.entityType
    const {url} = props.match
    const {history, user} = props


    const openPage = (pageName) => {
        if (isMobileDevice()) {
            //toggleMenu(_, true)
        }
        props.history.push('/page/'+pageName)
    }

    return <div className={'sidebar sidebar-left fixed ' + (props.showMenu?'':'closed') }>
        <aside className="bu-menu">

            <ul className="bu-menu-list">
                <li>
                    <a onClick={_ => history.push('/library')} className={url === '/library'?'bu-is-active':''}>Home</a>
                </li>

                {
                    user && user.isLoggedIn && <li>
                        <a onClick={_ => history.push('/library/wizard')} className={url === '/library/wizard'?'bu-is-active':''}>Import Clip</a>
                    </li>
                }
            </ul>

            <p className="bu-menu-label">
                Content
            </p>
            <ul className="bu-menu-list">

                {
                    user && user.isLoggedIn && <li><a onClick={_ => history.push('/library/myclips')} className={url === '/library/myclips'?'bu-is-active':''}>My Clips</a></li>
                }

                <li><a onClick={_ => history.push('/library/sampleclips')} className={url === '/library/sampleclips'?'bu-is-active':''}>Sample Clips</a></li>

                {
                    user && user.isLoggedIn && <li><a onClick={_ => history.push('/library/templates')} className={url === '/library/templates'?'bu-is-active':''}>Templates</a></li>
                }

            </ul>
            <p className="bu-menu-label">
                Help
            </p>
            <ul className="bu-menu-list">
                {/*<li><a onClick={_ => history.push('/pricing')} className={url === '/pricing'?'is-active':''}>Pricing</a></li>*/}
                {/*<li><a onClick={_ => history.push('/getting')} className={url === '/getting'?'is-active':''}>Getting Started</a></li>*/}
                <li><a onClick={_ => openPage('terms')} className={url === '/page/terms'?'is-active':''}>Terms</a></li>
                <li><a onClick={_ => openPage('privacy')} className={url === '/page/privacy'?'is-active':''}>Privacy</a></li>
            </ul>

            {/*{*/}
                {/*user && user.isLoggedIn &&*/}
                {/*<React.Fragment>*/}
                    {/*<p className="menu-label">*/}
                        {/*Shows*/}

                        {/*<NiceButton intent={Intent.PRIMARY} className='push-right' small={true} minimal={true} text={'Add Podcast'} onClick={props.onAddShow} />*/}
                    {/*</p>*/}

                    {/*<ul className="menu-list show-list">*/}
                        {/*{*/}
                            {/*props.feeds && props.feeds.map(show => {*/}

                                {/*const active = show.id === parseInt(props.match.params.entityId)*/}
                                {/*const menuItemClass = (active?' is-active':'')*/}

                                {/*if (!show.id) {*/}
                                    {/*//console.log(show)*/}
                                    {/*return <span id={show.id} />*/}
                                {/*}*/}

                                {/*return <li key={show.id}>*/}

                                    {/*<a*/}
                                        {/*className={menuItemClass}*/}
                                        {/*onClick={_ => props.history.push(`/library/feed/${show.id}`)}>*/}
                                        {/*<img src={show.image} height={30} className={'show-icon'} />*/}
                                        {/*<span>{show.name}</span>*/}
                                    {/*</a>*/}
                                {/*</li>*/}
                            {/*})*/}
                        {/*}*/}
                    {/*</ul>*/}
                {/*</React.Fragment>*/}
            {/*}*/}

        </aside>
    </div>
}

const PersistentComponent = withStorage(
    React.Component,
    'LocalSettings',
    ['userSettings']
)


class App extends HomeDataComponent {

    state = {
        clipId: null,
        showNewClip: false,
        clipsById: null,
        clips: [],
        feedsById: null,
        feeds: [],
        showAssets: false,
        loading: false,
        showWizard: false,
        showMenu: null,//!isMobileDevice(),
        showSettings: false,
        showPodcastSearch: false,
        user: {
            isLoggedIn: false
        }
    }

    componentDidMount() {
        //this.loadLayouts()

        //this.loadJobs()

        this.loadData()

        const savedSettings = localStorage.getItem('userSettings')
        if (savedSettings) {
            const userSettings = JSON.parse(savedSettings)
            document.body.className = userSettings.dark?'bp3-dark':''
        }
        else {
            document.body.className = 'bp3-dark'
        }

        const {match} = this.props
        if (match) {
            const {page} = match.params
            console.log(page)
        }

    }

    onLoginSuccess = () => {
        this.loadData()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

    }


    loadJobs(){

        const isActive = job => {
            if (job.failedReason) return false
            if (job.finishedOn && job.processedOn < job.finishedOn) return false

            return true
        }

        axios.get('/admin/api/job/index').
        then(res => {

            const jobs = res.data
            const hasActiveJobs = jobs.filter(isActive).length > 0

            if (hasActiveJobs) {
                this.timeout = setTimeout(this.loadJobs.bind(this), 10000)
            }
            else if (this.state.hasActiveJobs) {
                this.loadAllData()
            }

            this.setState({
                jobs: jobs,
                hasActiveJobs: hasActiveJobs
            })

        })
    }

    onJobClose() {
        console.log('close')
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }
    }

    loadFeedDetail(feedId) {
        axios.get('/admin/api/feed/' + feedId).
        then(res => {

            const index = findIndex(this.state.feeds, {id: feedId})

            const updateFeed = {
                ['Podcasts'] : {$set: res.data.Podcasts}
            }

            this.setState(
                update(this.state, {
                    feeds: {[index]: updateFeed},
                    feedsById: {[feedId]: updateFeed}
                })
            )
        })
    }

    getAllClips() {
        const clipsPromise = axios.get('/admin/api/clip/index')
        return clipsPromise
    }

    getAllFeeds() {
        const feedsPromise = axios.get('/admin/api/feed/index')
        return feedsPromise
    }

    showNewClipOverlay(){
        this.setState({showNewClip: true})
    }

    closeOverlay() {
        this.setState({showNewClip: false})
    }



    openWizard() {
        this.setState({showWizard: true})
    }

    closeWizard() {
        //this.setState({showWizard: false})

    }

    toggleMenu(e, forceClose) {

        const st = forceClose?false:!this.state.showMenu
        this.setState({
            showMenu: st
        })
    }

    togglePodcastImport = (refresh) => {

        this.setState({
            showPodcastSearch: !this.state.showPodcastSearch
        })

        if (refresh) {
            this.loadAllData()
        }
    }

    closeMenu = () => {
        //need to close the menu by default
        this.setState({showMenu: false})
    }

    subscribeToPlan(planId) {
        const {user} = this.state

        if (!user.hasBilling) {
            return this.setState({
                noBilling: true
            })
        }

        this.setState({
            planId
        })
    }

    confirmSubscription = () => {
        const {planId} = this.state

        this.setState({
            subscribing: true
        })

        axios.post('/admin/api/user/subscribe', {
            planId
        }).
        then(res => {

            const {status} = res.data

            if (status === 'incomplete') {
                this.setState({billingError: true})
            }

            this.loadUser()

            this.setState({
                subscribing: false,
                planId: null
            })
        })
    }

    updateTemplates = (templates) => {
        this.setState({templates})
    }

    toggleSettings() {
        this.setState({showSettings: !this.state.showSettings})
    }

    openSettings = e => {
        if (isMobileDevice()) {
            this.toggleMenu(true)
        }
        props.history.push('/settings')
    }

    toggleProfile = () => {
        this.setState({showProfile: !this.state.showProfile})
    }

    toggleLogin = () => {
        this.setState({showLogin: !this.state.showLogin})
    }


    render() {

        const {clipsById, feedsById, feeds, clips, user, noBilling, userPlan, planId, billingError,
            showMenu, loading, myClips, showPodcastSearch, myFeeds, showProfile, templates, libraryTemplates, showLogin} = this.state


        const goTo = tab => this.props.history.push(tab)

        const refreshJobs = () => {
            setTimeout(this.loadJobs.bind(this), 5000)
        }

        const Pricing = props => {
            return <div className='sidebar-open'>

                <Alert
                    intent={Intent.DANGER}
                    isOpen={noBilling || billingError}
                    onConfirm={this.openSettings}
                    onCancel={e => this.setState({noBilling: false})}
                    cancelButtonText="Cancel"
                    confirmButtonText="Update billing">
                    {
                        noBilling && <p>Please update your billing information to subscribe.</p>
                    }
                    {
                        billingError && <p>There was an error processing your billing method. Please update your billing information to subscribe.</p>
                    }
                </Alert>

                <Alert
                    intent={Intent.PRIMARY}
                    isOpen={!!planId}
                    onConfirm={this.confirmSubscription}
                    onCancel={e => this.setState({planId: null})}
                    cancelButtonText="Cancel"
                    confirmButtonText="Subscribe">
                    <p>You're about to subscribe to the premium plan for $10/month</p>
                </Alert>

                <div className='pricing-page content'>

                    <H3>Pricing</H3>

                    <section className='columns'>

                        <div className='column content is-medium is-one-third'>
                            <Card className='pricing-tier'>
                                <H4>Basic</H4>
                                <H5>Free</H5>


                                <div>
                                    Maximum upload size of <span>10MB</span>
                                </div>
                                <div>
                                    Import up to <span>5 minutes</span> of audio/video per month with transcript
                                </div>
                                <div>
                                    Clip duration of <span>1 minute</span> max
                                </div>
                                <div>
                                    Create <span>1</span> custom video template
                                </div>
                                <div>
                                    <span>Limited access</span> to the library of templates
                                </div>
                                <div>
                                    Export up to <span>60 seconds</span> of video (with watermark)
                                </div>

                                {
                                    user.isLoggedIn && <Button
                                        large={true}
                                        disabled={true}
                                        text={'You are using this Plan'}
                                    />
                                }

                            </Card>
                        </div>

                        <div className='column content is-medium is-one-third'>
                            <Card className='pricing-tier'>
                                <H4>Premium</H4>
                                <H5>$10/Month</H5>

                                <div>
                                    Maximum upload size of <span>100MB</span>
                                </div>
                                <div>
                                    Import up to <span> 30 minutes</span> of audio/video per month with transcript
                                </div>

                                <div>
                                    Clip duration of <span>10</span> minute max
                                </div>

                                <div>
                                    Create <span>10</span> custom video templates
                                </div>
                                <div>
                                    <span>Full access</span> to the library of templates
                                </div>
                                <div>
                                    Export up to <span>10 minutes</span> of video
                                </div>

                                {
                                    user.isLoggedIn && <Button
                                        large={true}
                                        onClick={e => this.subscribeToPlan(1)}
                                        intent={Intent.PRIMARY}
                                        text={'Switch to Premium'}
                                    />
                                }

                            </Card>
                        </div>

                    </section>
                </div>

            </div>
        }


        const ContentLayout = props => {

            const {match} = props
            const {page} = match.params

            if (showMenu === null && page !== 'clip') {
                this.toggleMenu()
            }

            return <div className={'scroll-container'}>
                <div className='sidebar-portal' />

                <Dialog
                    isOpen={showProfile}
                    onClose={this.toggleProfile}
                >
                    <div className={'bp3-dialog-body'}>
                        <UserLoginSignup
                            section={'signup'}
                            onClose={this.toggleProfile}
                            onSuccess={this.onLoginSuccess}
                        />
                    </div>
                </Dialog>

                <Dialog
                    isOpen={showLogin}
                    onClose={this.toggleLogin}
                >
                    <div className={'bp3-dialog-body'}>
                        <UserLoginSignup
                            onClose={this.toggleLogin}
                            onSuccess={this.onLoginSuccess}
                        />
                    </div>
                </Dialog>

                {
                    (page !== 'clip') && <NavigationBar
                        {...this.state}
                        {...props}
                        className={page === 'transcript' ? "bu-is-fixed-top" : ''}
                        toggleMenu={this.toggleMenu.bind(this)}
                        toggleSettings={this.toggleSettings.bind(this)}
                        openProfile={this.toggleProfile}
                        openLogin={this.toggleLogin}
                    >
                    </NavigationBar>
                }

                {
                    (page === 'library') && <div>

                        <PodcastSearch
                            show={showPodcastSearch}
                            onClose={this.togglePodcastImport}
                        />

                        {/*style={showMenu? {paddingLeft:'240px'}:{}}*/}
                        <div className={showMenu?'sidebar-open':''}>
                            {
                                clipsById &&
                                <Library
                                    user={user}
                                    userPlan={userPlan}
                                    clipsById={clipsById}
                                    feedsById={feedsById}
                                    updateTemplates={this.updateTemplates}
                                    feeds={myFeeds}
                                    clips={clips}
                                    templates={templates}
                                    myClips={myClips}
                                    history={props.history}
                                    match={props.match}
                                    location={props.location}
                                    refresh={this.loadAllData.bind(this)}
                                    refreshing={loading}
                                    togglePodcastImport={this.togglePodcastImport}
                                    closeMenu={this.closeMenu}
                                    showMenu={showMenu}
                                    libraryTemplates={libraryTemplates}
                                />
                            }
                        </div>

                    </div>
                }

                {
                    page === 'pricing' && <Pricing />
                }

                {
                    page === 'getting' && <div className='sidebar-open'><GettingStarted /></div>
                }

                {
                    page === 'clip' && feeds && feedsById && <ClipEditor
                        //key={clipId}
                        id={match.params.entityType}
                        history={props.history}
                        match={props.match}
                        loadFeedDetail={this.loadFeedDetail.bind(this)}
                        showClipOverlay={this.showNewClipOverlay.bind(this)}
                        renderNavigation={content => <NavigationBar
                            {...this.state}
                            toggleMenu={this.toggleMenu.bind(this)}
                            toggleSettings={this.toggleSettings.bind(this)}
                            {...props}
                            className="bu-is-fixed-top"
                        >
                            {content}
                        </NavigationBar>}
                        clips={clips}
                        feedsById={feedsById}
                        feeds={feeds}
                        myFeeds={myFeeds}
                        refresh={this.loadAllData.bind(this)}
                        refreshJobs={refreshJobs}
                        closeMenu={this.closeMenu}
                        user={user}
                    />
                }

                {
                    page === 'page' && <Page
                        pageName={match.params.entityType}
                        {...props}
                        {...this.state}
                    />
                }

                {
                    page === 'transcript' && <Transcript
                        id={match.params.entityType}
                        {...props}
                        toggleMenu={this.toggleMenu.bind(this)}
                    />
                }

                <GlobalMenu
                    showMenu={showMenu}
                    history={props.history}
                    match={props.match}
                    feeds={myFeeds}
                    user={user}
                    onAddShow={e => this.togglePodcastImport()}
                />

            </div>
        }

        return <Router basename="/app">
            <div className={'audiodive-router'}>

                <Route path="/:page/:entityType?/:entityId?/:extra?" render={ContentLayout} />



                {/*<Route path="/clip/:id/:section?/:entityId?" render={ClipLayout} />*/}

                {/*<Route path="/page/:id" render={Page}  />*/}

                {/*<Route exact path="/clip" render={ClipLayout} />*/}
                {/*<Route exact path="/pricing" render={Pricing} />*/}

                <Route exact path="/" render={() => <Redirect to="/library"/>} />
            </div>
        </Router>
    }
}


ReactDOM.render((
    <Provider store={clipStore}>
        {
            <App />
        }
    </Provider>
), document.getElementById('react-app'))
