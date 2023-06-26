import TimeAgoModule from 'react-timeago'
import {Alignment, Navbar, Button, H2, InputGroup, NavbarGroup, NavbarHeading} from "@blueprintjs/core"
import React from 'react'
import {QueryList} from "@blueprintjs/select"

const TimeAgo = TimeAgoModule.default

import LazyLoad from 'react-lazyload';
import { forceCheck } from 'react-lazyload';
import Loading from "./loading.js"
import './album-list.scss'

export const filterAlbum = (query, asset) => {

    const text = asset.name || asset.title

    return `${text.toLowerCase()}`.indexOf(query.toLowerCase()) >= 0
}


const formatDate = (date) => {
    const d = new Date(date);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString( undefined, options);
}


function highlightText(text, query) {
    let lastIndex = 0
    const words = query
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(escapeRegExpChars)
    if (words.length === 0) {
        return [text]
    }
    const regexp = new RegExp(words.join("|"), "gi")
    const tokens = []
    while (true) {
        const match = regexp.exec(text)
        if (!match) {
            break
        }
        const length = match[0].length
        const before = text.slice(lastIndex, regexp.lastIndex - length)
        if (before.length > 0) {
            tokens.push(before)
        }
        lastIndex = regexp.lastIndex
        tokens.push(<strong key={lastIndex}>{match[0]}</strong>)
    }
    const rest = text.slice(lastIndex)
    if (rest.length > 0) {
        tokens.push(rest)
    }
    return tokens
}

function escapeRegExpChars(text) {
    return text.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")
}

export default class AlbumsList extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            loadedRowCount: 0,
            loadedRowsMap: {},
            loadingRowCount: 0,
            query: ''
        }

    }

    componentWillUnmount() {
    }

    handleQueryChange(e) {
        this.setState({
            query: e.target.value
        }, () => {
            forceCheck()
        })

        this.props.onQueryChange && this.props.onQueryChange(e.target.value)
    }

    onActiveItemChange(ff) {
        //console.log(ff)
    }

    getRatio(episode) {
        if (episode.lastVideo) {

            switch (episode.lastVideo.ratio) {
                case 'square':
                    return '1by1';

                case 'wide':
                    return '16by9';

                case 'vertical':
                    return '9by16';
            }
        }

        return  '1by1'
    }

    render() {
        const {list, onItemSelect, activeAlbum, label, actions, noSelected, renderCard, showSearch,
            newItem, noFiltering, handleDelete, handleOpen, handleAction ,canDelete, noItemsLabel, onNextPageClick} = this.props;
        const {loadedRowCount, loadingRowCount, query} = this.state;

        const albumRenderer = (listProps) => {

            const { filterable, handleKeyDown, handleKeyUp, itemList, query } = listProps
            return (
                <div className='album-list-wrapper' onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>

                    {
                        showSearch &&
                        <Navbar className={`navbar-small`}>

                            <NavbarGroup>
                                <InputGroup
                                    large={true}
                                    leftIcon="search"
                                    placeholder="Search..."
                                    value={query}
                                    onChange={this.handleQueryChange.bind(this)}/>
                            </NavbarGroup>

                            {
                                actions &&
                                <NavbarGroup>{actions}</NavbarGroup>
                            }
                        </Navbar>
                    }

                    <H2>{label}</H2>

                    {itemList}
                </div>
            )
        }


        const renderAlbum = (episode, props) => {

            const { handleClick, modifiers, query} = props

            if (!modifiers.matchesPredicate && !noFiltering) {
                return null
            }

            //const date = <TimeAgo date={episode.updatedAt} />
            const date = <TimeAgo date={episode.updatedAt} />
            const text = episode.name || episode.title
            const url = episode.resizedImage || episode.image || episode.imageUrl || episode.itunes_image || '/images/no-preview.jpg'
            let subtitle = episode.primaryGenreName
            if (episode.PodcastFeed) {
                subtitle = episode.PodcastFeed.name
            }

            const ratio = url? this.getRatio(episode) : '1by1'



            return (
                <div
                    className={modifiers.active && !noSelected? 'bu-column bu-is-one-fifth selected':'bu-column bu-is-one-fifth'}
                    key={episode.id || episode.guid}
                    onClick={handleClick}>
                    <div className='bu-card'>

                        {/*<LazyLoad height={220} scrollContainer={'.scroll-container'}>*/}
                            {/*<div className="bu-card-image">*/}
                                {/*<figure className={`bu-image is-${ratio}`}>*/}
                                    {/*<img src={url} />*/}
                                {/*</figure>*/}
                            {/*</div>*/}
                        {/*</LazyLoad>*/}

                        <div className="bu-card-image">
                            <figure className={`bu-image is-${ratio}`}>
                                <img src={url} />
                            </figure>
                        </div>

                        <div className="bu-card-content">
                            <article className="bu-media">
                                {/*<Media.Item renderAs="figure" position="left">*/}
                                    {/*<Image renderAs="p" size={64} alt="64x64" src="http://bulma.io/images/placeholders/128x128.png" />*/}
                                {/*</Media.Item>*/}
                                <div className="bu-media-content">
                                    <h4 size={5}>{highlightText(text, query)}</h4>
                                    {episode.id}
                                    {
                                        subtitle && <h5 subtitle size={6}>
                                            {subtitle}
                                        </h5>
                                    }

                                </div>
                            </article>
                            <div className={'bu-content'}>
                                {date && <div>{date}</div>}
                            </div>
                        </div>

                        {
                            (handleDelete || handleOpen) && <div className="bu-card-footer">

                                {
                                    handleOpen &&  <a className="bu-card-footer-item" onClick={e => {
                                        e.preventDefault()
                                        handleOpen(episode.id)
                                    }}>
                                        Open
                                    </a>
                                }

                                {
                                    canDelete && handleAction &&  <a className="bu-card-footer-item" onClick={e => {
                                        e.preventDefault()
                                        handleAction(episode.id)
                                    }}>
                                        Action
                                    </a>
                                }

                                {
                                    canDelete && canDelete(episode) && <a className="bu-card-footer-item" onClick={e => {
                                        e.preventDefault()
                                        handleDelete(episode.id)
                                    }}>
                                        Delete
                                    </a>
                                }

                            </div>
                        }

                    </div>
                </div>
            )
        }

        const renderAlbums = ({ items, itemsParentRef, query, renderItem }) => {
            const renderedItems = items.filter(item => (item != null && item.id !== null)).map(renderItem)
            return (
                <div className='bu-columns bu-is-multiline'>
                    {renderedItems}

                    {noItemsLabel && <h4 className='full-width bu-has-text-centered margin-top bu-subtitle bp3-text-muted'>{noItemsLabel}</h4>}

                    {newItem}

                </div>
            )
        }

        if (!list) return <div className='bp3-text-muted'><h4>No results</h4></div>

        const activeItem = activeAlbum? activeAlbum:false

        return (
            <QueryList

                query={query}
                renderer={albumRenderer}
                className='assets-list'
                itemPredicate={filterAlbum}
                itemRenderer={renderCard || renderAlbum}
                itemListRenderer={renderAlbums}
                noResults={<div className='no-result' />}
                onItemSelect={onItemSelect}
                onActiveItemChange={this.onActiveItemChange.bind(this)}
                activeItem={activeItem}
                items={list}>
            </QueryList>
        )
    }
}