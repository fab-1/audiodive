import React from "react";
import {MenuItem, Intent, Tag,  Card, NavbarGroup, Alignment, NavbarHeading} from "@blueprintjs/core"
import LazyLoadModule from 'react-lazyload';
const LazyLoad = LazyLoadModule.default

export const renderEpisode = (episode, { handleClick, modifiers, query }) => {
    if (!modifiers.matchesPredicate) {
        return null
    }
    const text = `${episode.title}`
    const date = episode.date || episode.createdAt
    return (
        <MenuItem
            active={modifiers.active}
            label={date?formatDate(date):null}
            key={episode.id || episode.guid}
            onClick={handleClick}
            text={highlightText(text, query)}
        />
    )
}

export const filterAsset = (query, asset) => {
    return `${asset.name.toLowerCase()}`.indexOf(query.toLowerCase()) >= 0
}

export const renderAssets = ({ items, itemsParentRef, query, renderItem }) => {
    const renderedItems = items.map(renderItem).filter(item => item != null)
    return (
        <ul className='bp3-list-unstyled assets-container'>{renderedItems}</ul>
    )
}


export const renderTemplates = ({ items, itemsParentRef, query, renderItem }) => {
    const renderedItems = items.map(renderItem).filter(item => item != null)
    return (
        <ul className='bp3-list-unstyled assets-container templates-list'>{renderedItems}</ul>
    )
}


export const renderAsset = (asset, { handleClick, modifiers, query }) => {
    if (!modifiers.matchesPredicate) {
        return null
    }
    const text = `${asset.name}`
    const url = asset.path || asset.imageUrl || '/images/no-preview.jpg'
    return (
        <li
            className={modifiers.active?'selected':''}
            key={asset.id}
            onClick={handleClick}>
            <div>
                {
                    asset.type === 'font'? <h3>Custom Font</h3> : <LazyLoad scrollContainer={'.draggable-panel-inner'}>
                        <img src={url} />
                    </LazyLoad>
                }
            </div>

            <label className='bp3-label bp3-text-overflow-ellipsis'>
                {highlightText(text, query)}
            </label>

        </li>
    )
}

export const renderTemplate = (asset, { handleClick, modifiers, query }) => {
    if (!modifiers.matchesPredicate) {
        return null
    }
    const text = `${asset.name}`
    const url = asset.path || asset.imageUrl || '/images/no-preview.jpg'
    return (
        <li
            className={modifiers.active?'selected':''}
            key={asset.id}
            onClick={handleClick}>
            {asset.FeedId === 1? <Tag>Library Template</Tag>:''}
            <div>
                <img src={url} />
            </div>

            <label className='bp3-label bp3-text-overflow-ellipsis'>
                {highlightText(text, query)}
            </label>

        </li>
    )
}


export const filterEpisode = (query, episode) => {
    //console.log(episode)
    return `${episode.title.toLowerCase()}`.indexOf(query.toLowerCase()) >= 0
}


export const filterGeneric =  (query, feed) => {
    const name = feed.name || feed.label
    return `${name.toLowerCase()}`.indexOf(query.toLowerCase()) >= 0
}

export const renderGeneric = (feed, props) => {

    const { handleClick, modifiers, query } = props
    if (!modifiers.matchesPredicate) {
        return null
    }
    const text = `${feed.name}`
    return (
        <MenuItem
            active={modifiers.active}
            key={feed.id}
            onClick={handleClick}
            label={feed.label}
            text={highlightText(text, query)}
        />
    )
}


export const renderFont = (feed, props) => {

    const { handleClick, modifiers, query } = props
    if (!modifiers.matchesPredicate) {
        return null
    }
    const text = feed.label

    return (
        <MenuItem
            active={modifiers.active}
            key={feed.label}
            onClick={handleClick}
            //label={feed.label}
            text={highlightText(text, query)}
        />
    )
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