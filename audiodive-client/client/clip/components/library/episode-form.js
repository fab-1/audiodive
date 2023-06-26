import React from 'react'
import axios from 'axios'
import {
    Icon, Intent,
    Button,
    ButtonGroup,
    Popover,
    Classes,
    Position,
    H4,
    MenuItem,
    NavbarGroup,
    NavbarHeading,
    Navbar,
    NavbarDivider,
    Toaster,
    FormGroup,
    TextArea,
    InputGroup,
    Card
} from "@blueprintjs/core"
import { Select } from "@blueprintjs/select";
import RichTextEditor from 'react-rte';
import ClipCutter from '../clip-editor/clip-cutter'
import {Alignment} from "@blueprintjs/core/lib/esm/index"
import {filterGeneric, renderGeneric} from "../../../shared/controls/custom-select"

const TABS = {
    GENERAL: 'general',
    DETAILS: 'details'
}

const AppToaster = Toaster.create({
    className: "notifications",
    position: Position.TOP_RIGHT
})

class EpisodeForm extends React.Component {

    constructor() {
        super()

        this.state = {
            episode: null,
            description: RichTextEditor.createEmptyValue(),
            currentTab: TABS.GENERAL,
            showClipCutter: false
        }
    }

    componentDidMount() {





        // this.setState({
        //     episode: episode,
        //     showClipCutter: showClipCutter
        // })

        this.loadEpisode()
    }

    loadEpisode() {

        const {episode, feedId} = this.props

        // axios.get('/admin/api/episode/' + id).
        // then(res => {
        //
        //     const description = RichTextEditor.createValueFromString(res.data.description, 'html')
        //     this.setState({
        //         episode: res.data,
        //         description: description
        //     })
        // })

        axios.get(`/admin/api/episode/${feedId}?guid=${encodeURIComponent(episode.guid)}`).
        then(res => {
            const {data} = res

            this.setState({
                episode: data.episode
            })

            if (data.peaks) {
                axios.get(data.peaks).
                then(peakRes => {
                    this.setState({
                        audioUrl: data.url,
                        audioPeaks: peakRes.data,
                        inlineMessage: ''
                    })
                })
            }
            else {
                this.getEpisodeAudioUrl(data.episode.id)
            }
        })
    }

    getEpisodeAudioUrl(episodeId) {
        axios.post(`/admin/api/episode/${episodeId}`).
        then(res => {

            const {data} = res

            this.setState({
                episodeId: episodeId,
                audioUrl: data.url,
                inlineMessage: ''
            })

        })
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.episode !== this.props.episode) {
            console.log('loading new episode')
            this.loadEpisode()
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
                {episode: {[key]: {$set: value}}}
            )
        )
    }

    handleValueChange(val) {
        this.setState({selectedEpisode: val})
    }

    descriptionChange(value) {
        const v = value.toString('html')
        this.valueChange('description', v)
    }

    loadUsers() {
        axios.get(`/admin/api/creator/index`).
        then(res => {
            this.setState({
                users: res.data
            })
        })
    }

    handleTabChange(tab) {
        this.setState({currentTab: tab})

        if (tab === TABS.DETAILS) {
            this.loadUsers()
        }
    }

    newClip(){
        const {history, match} = this.props
        history.push(`${match.url}/newclip`)
    }

    setUser(user) {
        this.valueChange('CreatorId', user.id)
    }

    save() {
        const {episode} = this.state
        axios.post(`/admin/api/podcast/${episode.id}`, episode).
        then(res => {

        })
    }

    render() {

        const {episode, description, showClipCutter, currentTab, users, audioUrl, audioPeaks} = this.state
        const {history, match} = this.props
        const {params} = match

        if (!episode) {
            return <div />
        }

        const saveClip = () => {
            this.clipCutterRef.saveClip()
        }

        const activeUser = users && users.find(user => user.id === episode.CreatorId)

        return (
            <div className='episode-form'>

                <H4>{episode.title}</H4>

                <img src={episode.image} />

                <p className='bp3-running-text' dangerouslySetInnerHTML={{__html:episode.description}}>
                </p>

                <Card>
                    {
                        currentTab === TABS.GENERAL &&
                        <div>
                            <ClipCutter
                                showForm={false}
                                key={episode.guid}
                                episodeId={episode.id}
                                audioUrl={audioUrl}
                                audioPeaks={audioPeaks}
                                //onClipChange={clipCut => this.setState({clipCut})}
                            />
                        </div>
                    }

                    {/*{*/}
                        {/*currentTab === TABS.DETAILS &&*/}
                        {/*<div className='episode-detail'>*/}

                            {/*<FormGroup label='Title'>*/}
                                {/*<InputGroup value={episode.title} onChange={this.valueChange.bind(this, 'title')} />*/}
                            {/*</FormGroup>*/}

                            {/*<FormGroup label='Description'>*/}
                                {/*<RichTextEditor value={description} onChange={this.descriptionChange.bind(this)} />*/}
                            {/*</FormGroup>*/}

                            {/*{*/}
                                {/*users &&*/}
                                {/*<FormGroup label='Creator'>*/}

                                    {/*<Select*/}
                                        {/*noResults={<MenuItem disabled={true} text="No results." />}*/}
                                        {/*items={users}*/}
                                        {/*itemPredicate={filterGeneric}*/}
                                        {/*itemRenderer={renderGeneric}*/}
                                        {/*onItemSelect={this.setUser.bind(this)}>*/}

                                        {/*<Button*/}
                                            {/*rightIcon="caret-down"*/}
                                            {/*text={activeUser? activeUser.name:'Select User'}*/}
                                        {/*/>*/}
                                    {/*</Select>*/}
                                {/*</FormGroup>*/}
                            {/*}*/}

                            {/*<Button*/}
                                {/*intent={Intent.PRIMARY}*/}
                                {/*icon={'floppy-disk'}*/}
                                {/*text={'Save'}*/}
                                {/*onClick={this.save.bind(this)} />*/}
                        {/*</div>*/}
                    {/*}*/}

                </Card>

            </div>
        )
    }
}

EpisodeForm.propTypes = {}

export default EpisodeForm
