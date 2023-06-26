import React from 'react'

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
    H3,
    Toaster
} from "@blueprintjs/core"

import axios from 'axios'
import AlbumsList from "../shared/album-list"

class FeedPage extends React.Component {

    state = {

    }

    componentDidMount() {
        if (this.props.selectedFeed) {
            this.loadFeed()
        }
    }

    componentDidUpdate(oldProps, oldState) {

        if (oldProps.selectedFeed !== this.props.selectedFeed) {
            this.loadFeed()
        }

    }

    loadFeed() {
        const {selectedFeed} = this.props
        if (!selectedFeed.jsonUrl) {
            axios.get('/admin/api/feed/' + selectedFeed.id).
            then(res => {
                this.loadEpisodes(res.data)
            })
        }
        else {
            this.loadEpisodes(selectedFeed)
        }
    }

    loadEpisodes(selectedFeed) {

        axios.get(selectedFeed.jsonUrl).then(res => {
            const jsonFeed = res.data
            this.setState({jsonFeed})
        })
    }

    render() {

        const {selectedFeed, match, history, onEpisodeSelected} = this.props
        const {jsonFeed} = this.state

        return <div>

            <Button className='push-right' text={'Refresh'} onClick={e => axios.post('/admin/api/feed/refresh/' + selectedFeed.id)}  />

            <div className='flex'>
                <img className={'show-icon'} src={selectedFeed.image} height={60} />
                <H3>  {selectedFeed.name}</H3>
            </div>

            <p className='bp3-running-text'>
                {selectedFeed.description}
            </p>

            {
                jsonFeed && <AlbumsList
                    className={'margin-top'}
                    inset={true}
                    activeAlbum={match.params.tab}
                    label={'Episodes'}
                    list={jsonFeed.items}
                    onItemSelect={episode => onEpisodeSelected(episode)}
                />

            }
        </div>
    }
}


export default FeedPage