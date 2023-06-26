import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Select, QueryList} from '@blueprintjs/select'
import {ControlGroup, Button, InputGroup,  Intent, ButtonGroup, FormGroup, Alert, Tooltip, Menu, MenuItem} from '@blueprintjs/core'
import axios from 'axios'
import Panel from './clip-editor/panel.jsx'
import {filterAsset, renderAsset, renderAssets, renderGeneric, filterGeneric} from "../../shared/controls/custom-select.js"
import {createMedia} from "../actions/clip-actions"
import Icons from '../../shared/custom-icons'
import update from 'immutability-helper'
import debounce from 'lodash/debounce'
import orderBy from 'lodash/orderBy'
import UI_TEXT from '../ui-text'
import {Position} from "@blueprintjs/core/lib/esm/index"

const SECTIONS = {
    CLIP: 'clip',
    TEMPLATE: 'template',
    FONTS: 'font'
}

const PAGES = {
    LOCAL: 'local',
    REMOTE: 'remote'
}

class AssetsManager extends Component {

    state = {
        assets: [],
        remoteAssets: [],
        query: '',
        search: '',
        selectedRemoteAsset: null,
        selectedAssetId: null,
        selectedFeedId: null,
        confirmDialog: false,
        sectionFilter: {
            [SECTIONS.TEMPLATE]: false,
            [SECTIONS.CLIP]: false
        },
        page: PAGES.LOCAL,
        currentPage: 1,
        totalPages: 1
    }

    componentDidMount(){

        this.setState({
            sectionFilter: {[this.props.section]: true},
            feedId: this.props.feedId
        }, this.loadAssets)

        this.saveDebounced = debounce(this.saveChange, 100)
        this.searchDebounced = debounce(this.searchAsset, 600)
        // axios.get('/admin/api/creator/index').
        // then(res => {
        //     this.setState({
        //         creators: res.data
        //     })
        // })
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.show && !prevProps.show) {
            this.loadAssets()
        }

        if (this.state.currentPage !== prevState.currentPage) {
            this.searchDebounced()
        }
    }

    searchAsset() {

        const {search, currentPage} = this.state

        const promise = axios.get('/admin/api/unsplash/search?query='+search + '&page='+currentPage). // + (feedId? '?feedId=' + feedId:'' )).
        then(res => {


            this.setState({
                remoteAssets: res.data.results.map(asset => {
                    asset.name = asset.description || asset.alt_description || ""
                    asset.path = asset.urls.thumb
                    return asset
                }),
                totalPages: res.data.total_pages
            })
        })
    }

    loadAssets = async () => {

        const {feedId} = this.props

        const res = await axios.get('/admin/api/asset/index') // + (feedId? '?feedId=' + feedId:'' )).
        const filtered = res.data.filter(asset => (asset.type === 'image' || asset.type === 'font'))
        const sorted = orderBy(filtered, ['updatedAt'], ['desc'])

        this.setState({
            assets: sorted,
            selectedAssetId: sorted.length? sorted[0].id : null
        })
    }

    saveChange(id, data){
        axios.post('/admin/api/file/' + id, data)
    }

    selectItem = (item) => {
        this.setState({
            selectedAssetId: item.id
        })
    }

    selectRemoteItem(item) {
        this.setState({
            selectedRemoteAsset: item
        })
    }

    handleQueryChange(event) {
        const query = event.currentTarget.value
        this.setState({ query })
    }

    handleSearchChange(event) {
        const search = event.currentTarget.value
        this.setState({ search }, () => this.searchDebounced())
    }

    insertAsset(name, url, selectedObject){
        const image = new Image()
        image.src = url
        image.onload = () => {
            const {width, height} = image
            this.props.onInsert({name, url, width, height}, selectedObject)
        }
        this.props.onClose()
    }

    insertAsset2(name, url){
        const image = new Image()
        image.src = url
        image.onload = () => {
            const {width, height} = image
            this.props.onInsert2({name, url, width, height})
        }
    }

    insertRemoteAsset(remoteAsset, selectedObject) {
        const promise = axios.post('/admin/api/unsplash/download', {
            id: remoteAsset.id
        }). // + (feedId? '?feedId=' + feedId:'' )).
        then(res => {

            const asset = res.data

            const image = new Image()
            image.src = asset.path
            image.onload = () => {
                const {width, height} = image
                this.props.onInsert({name: asset.name, url: asset.path, width, height}, selectedObject)
                //this.props.onClose()
            }


        })
    }

    handleImageUpload(event) {
        let newRecord = null
        let formData = new FormData()

        const showId = this.state.selectedFeedId || this.props.feedId

        if (showId) {
            formData.append('showId', showId) //todo rename all instances of feed to show?
        }

        formData.append("section", this.props.section)
        formData.append("imageData", event.target.files[0])

        axios.post(`/admin/api/asset/upload`, formData).
        then(res => {
            newRecord = res.data
            return this.loadAssets()
            //this.insertAsset(res.data.fileName, res.data.file)
        }).
        then(() => {
            this.selectItem(newRecord)
        })
    }

    setSection(section) {
        let {selectedAssetId, assets} = this.state
        const index = assets.findIndex(asset => asset.id === selectedAssetId)
        const selectedAsset = assets[index]
        let metadata = selectedAsset.metadata || {}
        metadata.section = section

        this.setState({
            assets: update(assets, {
                [index]: {metadata: {$set: metadata} }
            })
        })

        this.saveDebounced(selectedAssetId, {
            metadata: metadata
        })
    }

    updateAsset(key, e) {

        const val = e.target.value
        let {selectedAssetId, assets} = this.state
        const index = assets.findIndex(asset => asset.id === selectedAssetId)

        this.setState({
            assets: update(assets, {
                [index]: {[key]: {$set: val} }
            })
        })

        this.saveDebounced(selectedAssetId, {
            [key]: val
        })
    }

    deleteAsset() {
        const {selectedAssetId} = this.state
        axios.delete('/admin/api/asset/' + selectedAssetId).
        then(res => {

            this.setState({
                confirmDialog: false,
                selectedAssetId: null
            })

            this.loadAssets()
        })
    }

    toggleConfirm() {
        this.setState({
            confirmDialog: !this.state.confirmDialog
        })
    }

    toggleFilter(section) {
        let {sectionFilter} = this.state
        sectionFilter[section] = !sectionFilter[section]
        this.setState({sectionFilter})
    }

    selectCreator(creator) {
        this.updateAsset('CreatorId', {
            target: {value: creator.id}
        })
    }

    previousPage = () => {
        let {currentPage} = this.state
        if (currentPage > 1) {
            currentPage--
            this.setState({currentPage})
        }
    }

    nextPage = () => {
        let {currentPage, totalPages} = this.state
        if (currentPage < totalPages) {
            currentPage++
            this.setState({currentPage})
        }
    }

    selectFeed = (feed) => this.setState({selectedFeedId: feed.id})

    switchPage = (page) => this.setState({page})

    render() {

        const {feeds, feedId, selectedObject} = this.props
        const {selectedAssetId, assets, search, creators, selectedFeedId, page, remoteAssets, selectedRemoteAsset, currentPage, totalPages} = this.state
        const selectedAsset = assets.find(asset => asset.id === selectedAssetId)
        const metadata = selectedAsset && selectedAsset.metadata || {}
        const selectedCreator = selectedAsset && creators && creators.find(creator => creator.id === selectedAsset.CreatorId)
        const showId = selectedFeedId || feedId
        const feed = feeds.find(feed => feed.id === showId)

        const filteredAssets = assets.filter(asset => {
            return true//asset.PodcastFeedId === showId
        })

        const Pages = <ButtonGroup>
            <Button
                icon={'database'}
                active={page === PAGES.LOCAL}
                text={'Local Assets'}
                onClick={_ => this.switchPage(PAGES.LOCAL)} />
            <Button
                icon={'cloud'}
                active={page === PAGES.REMOTE}
                text={'Online Search'}
                onClick={_ => this.switchPage(PAGES.REMOTE)} />
        </ButtonGroup>

        const Pagination = <ControlGroup>
            <Button icon={'chevron-left'} onClick={this.previousPage} disabled={!totalPages || currentPage === 1} />
            <InputGroup style={{width:'50px'}} value={currentPage} disabled={!totalPages} />
            <Button icon={'chevron-right'} onClick={this.nextPage} disabled={!totalPages || currentPage === totalPages} />
        </ControlGroup>

        const assetsRenderer = (listProps) => {

            const { filterable, handleKeyDown, handleKeyUp, itemList, query } = listProps

            return (
                <div onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
                    <div className='top-bar'>

                        <ControlGroup fill={true}>
                            {Pages}
                            <InputGroup
                                leftIcon="search"
                                placeholder="Filter..."
                                value={query}
                                onChange={this.handleQueryChange.bind(this)}/>
                        </ControlGroup>


                    </div>

                    {itemList}
                </div>
            )
        }

        const remoteAssetsRenderer = (listProps) => {

            const { filterable, handleKeyDown, handleKeyUp, itemList, query } = listProps

            return (
                <div onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
                    <div className='top-bar flex space-between'>

                        <ControlGroup fill={true}>
                            {Pages}
                            <InputGroup
                                leftIcon="search"
                                placeholder="Filter..."
                                value={search}
                                onChange={this.handleSearchChange.bind(this)}/>
                        </ControlGroup>

                        {Pagination}
                    </div>

                    {itemList}
                </div>
            )
        }

        if (!this.props.show) {
            return <span />
        }

        const isTextElement = selectedObject && selectedObject.type === 'htmlText'

        return (
            <Panel
                icon={Icons.imagesIcon}
                width={600}
                height={612}
                id={'assets-manager-panel'}
                className='assets-manager'
                title={'Assets Manager'}
                onClose={this.props.onClose}
                content={<section>

                    {
                        selectedAsset &&
                        <Alert
                            intent={Intent.DANGER}
                            icon="trash"
                            isOpen={this.state.confirmDialog}
                            onConfirm={this.deleteAsset.bind(this)}
                            onCancel={this.toggleConfirm.bind(this)}
                            cancelButtonText="Cancel"
                            confirmButtonText="Delete"
                        >
                            <p>You are about to delete the asset <strong>{selectedAsset.name}</strong></p>
                        </Alert>
                    }

                    {
                        page === PAGES.LOCAL && <QueryList
                            query={this.state.query}
                            renderer={assetsRenderer}
                            className='assets-list'
                            itemPredicate={filterAsset}
                            itemRenderer={renderAsset}
                            itemListRenderer={renderAssets}
                            noResults={<div className='no-result' />}
                            onItemSelect={this.selectItem}
                            activeItem={selectedAsset}
                            items={filteredAssets}>
                        </QueryList>
                    }


                    {
                        page === PAGES.REMOTE && <QueryList
                            query={''}
                            renderer={remoteAssetsRenderer}
                            className='assets-list'
                            itemPredicate={filterAsset}
                            itemRenderer={renderAsset}
                            itemListRenderer={renderAssets}
                            noResults={<div className='no-result' />}
                            onItemSelect={this.selectRemoteItem.bind(this)}
                            activeItem={selectedRemoteAsset}
                            items={remoteAssets}>
                        </QueryList>
                    }




                    <div className='bottom-bar'>


                        {
                            page === PAGES.LOCAL && <div>
                                <FormGroup label={'Selection'}>
                                    <ControlGroup>

                                        <InputGroup
                                            fill={true}
                                            placeholder="Selected Asset"
                                            value={selectedAsset?selectedAsset.name:''}
                                            onChange={this.updateAsset.bind(this, 'name')}
                                        />

                                        {
                                            !isTextElement && <Button
                                                intent={Intent.PRIMARY}
                                                text={this.props.insertImageLabel}
                                                icon="add"
                                                disabled={!selectedAsset}
                                                onClick={c => this.insertAsset(selectedAsset.name, selectedAsset.path)}
                                            />

                                        }

                                        {
                                            selectedObject &&
                                            <Button
                                                intent={Intent.PRIMARY}
                                                text={isTextElement? 'Pick as Background' : 'Replace'}
                                                icon="swap-horizontal"
                                                disabled={!selectedAsset}
                                                onClick={c => this.insertAsset(selectedAsset.name, selectedAsset.path, selectedObject)}
                                            />
                                        }

                                        <Button
                                            disabled={!selectedAsset}
                                            intent={Intent.DANGER}
                                            icon='trash'
                                            minimal={true}
                                            onClick={this.toggleConfirm.bind(this)}
                                        />

                                        <label className='upload-button bp3-button bp3-icon-upload bp3-intent-primary'>
                                            <input onChange={this.handleImageUpload.bind(this)} type="file" hidden />
                                            <span className='bp3-button-text'>Upload New</span>
                                        </label>
                                    </ControlGroup>
                                </FormGroup>
                            </div>
                        }




                        {
                            page === PAGES.REMOTE && selectedRemoteAsset &&
                            <div>
                                <FormGroup label={'Selection'}>
                                    <Button
                                        intent={Intent.PRIMARY}
                                        text={this.props.insertImageLabel}
                                        icon="add"
                                        disabled={!selectedRemoteAsset}
                                        onClick={c => this.insertRemoteAsset(selectedRemoteAsset)}
                                    />

                                    {
                                        selectedObject &&
                                        <Button
                                            intent={Intent.PRIMARY}
                                            text={'Replace'}
                                            icon="swap-horizontal"
                                            disabled={!selectedRemoteAsset}
                                            onClick={c => this.insertRemoteAsset(selectedRemoteAsset, selectedObject)}
                                        />
                                    }
                                </FormGroup>
                                Photo by <a href={selectedRemoteAsset.user.links.html+`?utm_source=AudioDive&utm_medium=referral`}>{selectedRemoteAsset.user.name}</a> on <a href="https://unsplash.com/?utm_source=AudioDive&utm_medium=referral">Unsplash</a>
                            </div>
                        }
                    </div>

                </section>}
            />

        )
    }
}

AssetsManager.propTypes = {}
AssetsManager.defaultProps = {
    section: SECTIONS.CLIP,
    insertImageLabel: 'Insert Image',
    insertImageLabel2: 'Insert Image'
}
AssetsManager.SECTIONS = SECTIONS

export default AssetsManager
