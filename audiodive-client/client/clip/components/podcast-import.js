import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
    Button,
    Classes,
    Dialog,
    FormGroup,
    Spinner,
    InputGroup,
    ControlGroup,
    Intent,
    Card,
    TagInput,
    MenuItem,
    Switch,
    Position,
    ButtonGroup, H4, TextArea
} from "@blueprintjs/core"
import {Select} from "@blueprintjs/select"
import {filterGeneric, renderGeneric} from "../../shared/controls/custom-select"
import axios from "axios"
import Icons from "../../shared/custom-icons"
import Loading from "./shared/loading"
import AlbumsList from "./shared/album-list"
import debounce from 'lodash/debounce'

class PodcastSearch extends Component {

    state = {
        remotePodcasts: [],
        loading: false,
        selectedPodcast: null
    }

    componentDidMount() {
        this.onQueryChangeDebounced = debounce(this.onQueryChange, 500)
    }

    onQueryChange = (query) => {

        this.setState({
            loading:true
        })

        axios.get(`https://itunes.apple.com/search?term=${query}&entity=podcast`).
        then(res => {

            const podcasts = res.data.results.map(podcast => {
                return Object.assign({
                    name: podcast.collectionName,
                    imageUrl: podcast.artworkUrl600,
                    id: podcast.collectionId
                }, podcast)
            })

            this.setState({
                remotePodcasts: podcasts,
                loading: false
            })
        })
    }


    onPodcastSelect = (podcast) => {
        this.setState({
            selectedPodcast: podcast
        })
    }

    importSelectedPodcast = () => {

        this.setState({
            loading:true
        })

        const {selectedPodcast} = this.state
        if (selectedPodcast) {
            axios.post('/admin/api/feed/import', selectedPodcast).
            then(res => {
                this.props.onClose(true)
                this.setState({
                    loading: false,
                    showPodcastImport: false,
                    selectedPodcast: null
                })
            })
        }
    }


    render() {

        const {show, onClose} = this.props
        const {loading, selectedPodcast, remotePodcasts} = this.state

        return (
            <Dialog
                style={{
                    width: '1080px'
                }}
                onClose={onClose}
                isOpen={show}
                title={'Search Podcast'}
                icon={Icons.podcastIcon}>

                <div className='add-podcast'>
                    <Loading show={loading}/>

                    <AlbumsList
                        noItemsLabel={remotePodcasts.length?null:'Type a keyword to search for a Podcast'}
                        showSearch={true}
                        actions={<Button
                            large={true}
                            intent={Intent.PRIMARY}
                            minimal={true}
                            disabled={!selectedPodcast}
                            onClick={this.importSelectedPodcast}
                            text={'Add'}
                            icon='add'
                        />}
                        list={remotePodcasts}
                        noFiltering={true}
                        onQueryChange={this.onQueryChangeDebounced}
                        onItemSelect={this.onPodcastSelect}
                        activeAlbum={selectedPodcast}
                    />
                </div>
            </Dialog>
        )
    }
}

PodcastSearch.propTypes = {}

export default PodcastSearch
