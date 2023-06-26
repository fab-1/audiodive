import useAnimationFrameModule from 'use-animation-frame';
const useAnimationFrame = useAnimationFrameModule.default
import ReactPlayerModule from 'react-player'
const ReactPlayer = ReactPlayerModule.default

import shortId from "shortid"
import PropTypes from 'prop-types';
import '../sass/transcript.scss';
import {fetchClip, updateGlobal} from "../actions/clip-actions"
import {connect} from "react-redux"
// Import React dependencies.
import React, { useState, useCallback, Component, useMemo } from 'react'
import { useDebounce } from 'use-debounce'
// Import the Slate editor factory.
import { createEditor, Transforms, Editor, Text  } from 'slate'

// Import the Slate components and React plugin.
import { Slate, Editable, withReact, useSlate } from 'slate-react'
import {ButtonGroup, FormGroup, Button, Slider, Intent, Icon} from "@blueprintjs/core"
import TimeInput from "../../shared/controls/time-input"
import NiceButton from '../components/shared/nice-button'
import axios from "axios"
import ReactDom from "react-dom"
import ClipSideBar from "./library"

function srtTimestamp(seconds) {
    var $milliseconds = seconds*1000;

    let $seconds = Math.floor($milliseconds / 1000);
    let $minutes = Math.floor($seconds / 60);
    let $hours = Math.floor($minutes / 60);
    $milliseconds =  Math.round($milliseconds % 1000);
    $seconds = $seconds % 60;
    $minutes = $minutes % 60;
    return ($hours < 10 ? '0' : '') + $hours + ':'
        + ($minutes < 10 ? '0' : '') + $minutes + ':'
        + ($seconds < 10 ? '0' : '') + $seconds + ','
        + ($milliseconds < 100 ? '0' : '') + ($milliseconds < 10 ? '0' : '') + $milliseconds;
}

const CodeElement = props => {
    return (
        <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
    )
}

const DefaultElement = props => {
    const {element, clip} = props
    const {id, children} = element
    let firstS = 0
    let lastS = 0

    if (clip && children) {
        const {wordsById} = clip.config
        const first = children[0].id
        const last = children[children.length - 1].id
        firstS = wordsById[first].start
        lastS = wordsById[last].end
    }

    return <div className={'transcript-block'}>
        <p {...props.attributes}>
            {props.children}
        </p>
        <div className={'timestamp'}>{srtTimestamp(firstS)}</div>
    </div>
}

const Leaf = props => {
    return (
        <span
            {...props.attributes}
            id={props.leaf.id}
            style={{
                fontWeight: props.leaf.bold ? 'bold' : 'normal',
                fontStyle: props.leaf.italic? 'italic' : 'normal'
            }}
            className={'leaf'}
        >
      {props.children}
    </span>
    )
}

// Define our own custom set of helpers.
const CustomEditor = {
    isBoldMarkActive(editor) {
        const result = Editor.nodes(editor, {
            match: n => n.bold === true,
            universal: true,
        })

        const [match] = result

        return !!match
    },

    isItalicMarkActive(editor) {
        const result = Editor.nodes(editor, {
            match: n => n.italic === true,
            universal: true,
        })

        const [match] = result

        return !!match
    },

    isCodeBlockActive(editor) {
        const [match] = Editor.nodes(editor, {
            match: n => n.type === 'code',
        })

        return !!match
    },

    toggleBoldMark(editor) {
        const isActive = CustomEditor.isBoldMarkActive(editor)
        Transforms.setNodes(
            editor,
            { bold: isActive ? null : true },
            { match: n => Text.isText(n), split: true }
        )
    },

    toggleItalicMark(editor) {
        const isActive = CustomEditor.isItalicMarkActive(editor)
        Transforms.setNodes(
            editor,
            { italic: isActive ? null : true },
            { match: n => Text.isText(n), split: true }
        )
    },

    toggleCodeBlock(editor) {
        const isActive = CustomEditor.isCodeBlockActive(editor)
        Transforms.setNodes(
            editor,
            { type: isActive ? null : 'code' },
            { match: n => Editor.isBlock(editor, n) }
        )
    },
}


const Toolbar = (props) => {
    const editor = useSlate()

    // const [match] = Editor.nodes(editor, {
    //     match: n => n.type === 'word',
    //     universal: true,
    // })

    // let selected
    // if (editor.selection !== null && editor.selection.anchor !== null) {
    //     selected = editor.children[editor.selection.anchor.path[0]];
    // } else {
    //     selected = null;
    // }
    // console.log(selected)

    return (
        <div>

            {/*<div className={'bu-navbar-brand'}>*/}
                {/*<NiceButton*/}
                    {/*icon={'left'}*/}
                    {/*text={'Back'}*/}
                    {/*onClick={event => {*/}
                        {/*event.preventDefault()*/}
                        {/*props.saveContent(editor.children)*/}
                    {/*}}*/}
                {/*/>*/}
            {/*</div>*/}

            {
                ReactDom.createPortal(<div className={'bu-navbar-item'}>


                    <NiceButton
                        intent={'primary'}
                        icon={'save'}
                        text={'Save'}
                        className={'margin-right'}
                        onClick={event => {
                            event.preventDefault()
                            props.saveContent(editor.children)
                        }}
                    />

                    <div className="bu-field bu-has-addons">
                        <div className="bu-control">

                            <NiceButton
                                intent={'info'}
                                //active={CustomEditor.isBoldMarkActive(editor)}
                                icon={'bold'}
                                text={'Bold'}
                                onClick={event => {
                                    event.preventDefault()
                                    CustomEditor.toggleBoldMark(editor)
                                }}
                            />
                        </div>
                        <div className="bu-control">
                            <NiceButton
                                intent={'info'}
                                //active={CustomEditor.isItalicMarkActive(editor)}
                                icon={'italic'}
                                text={'Italic'}
                                onClick={event => {
                                    event.preventDefault()
                                    CustomEditor.toggleItalicMark(editor)
                                }}
                            />
                        </div>
                    </div>
                </div>, document.querySelector('.navbar-portal'))
            }


        </div>
    )
}



const withHtml = editor => {
    const { insertData } = editor

    editor.insertData = data => {
        console.log('test')
        const plain = data.getData('text/plain')

        //https://github.com/ianstormtaylor/slate/blob/main/site/examples/paste-html.tsx
        // if (html) {
        //     const parsed = new DOMParser().parseFromString(html, 'text/html')
        //     const fragment = deserialize(parsed.body)
        //     Transforms.insertFragment(editor, fragment)
        //     return
        // }

        if (plain) {
            const fragment = plain
            //console.log(plain)
            Transforms.insertText(editor, fragment)
            return
        }

        insertData(data)
    }

    return editor
}

const App = (props) => {
    const editor = useMemo(() => withHtml(withReact(createEditor())), [])

    const playFromWord = React.useRef(null)

    const renderElement = useCallback(callbackProps => {
        switch (callbackProps.element.type) {
            case 'code':
                return <CodeElement {...callbackProps} />
            default:
                return <DefaultElement clip={props.clip} {...callbackProps} />
        }
    }, [])

    const renderLeaf = useCallback(props => {
        return <Leaf {...props} />
    }, [])

    const onPaste = (event) => {
        //event.preventDefault()

        console.log("Transfer Types:", event.clipboardData.types);

        // editor.insertText(
        //     "You pasted some content that had these transfer types: \n"
        // );

        for (let item of event.clipboardData.items) {
            console.log(item.getAsString(v => console.log(v)))
        }


       // editor.insertText("test");
    }

    const [value, setValue] = useState(props.content);

    const handleChange = (change, s, t) => {
        const {value} = change

        const isAstChange = editor.operations.some(
            op => 'set_selection' !== op.type
        )
        if (isAstChange) {
            // Save the value to Local Storage.
            //console.log(change)
        }

        setValue(value)
    };

    const handleClick = (e) => {
        switch (e.detail) {
            case 1:
                break;
            case 2:
                const [match] = Editor.nodes(editor, {
                    match: n => n.type === 'word',
                    universal: true,
                })
                props.playFromWord(match[0].id)
                break;
            case 3:
                break;
            default:
                return;
        }
    };

    const onKeyDown = (event, s , t) => {

        //console.log(event, s, t)


        const [match] = Editor.nodes(editor, {
            match: n => n.type === 'word',
            universal: true,
        })
        //console.log(match)

        //console.log(editor.selection)

        // if (event.key === '&') {
        //     // Prevent the ampersand character from being inserted.
        //     event.preventDefault()
        //     // Execute the `insertText` method when the event occurs.
        //     editor.insertText('and')
        // }
    }

    return (
        <Slate
            editor={editor}
            value={value}
            onChange={handleChange}
        >

            <Toolbar saveContent={props.saveContent} />

            <div className='transcript'>


                <Editable
                    className={'editor-component'}
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    onClick={handleClick}
                    onPaste={onPaste}
                    onKeyDown={onKeyDown}
                   // onSelect={(e, r) => console.log(e, r)}
                />

            </div>
        </Slate>
    )
}

const Player = (props) => {

    const {playFromWord} = props
    const [isPlaying, setIsPlaying] = useState(false)
    const [played, setPlayed] = useState(0)
    const [playedSeconds, setPlayedSeconds] = useState(0)
    const [duration, setDuration] = useState(0)
    const [playerRef, setPlayerRef] = useState(null)
    // React.useEffect(() => {
    //     playFromWord.current = playSeekFromWord
    // }, [playerRef])

    const syncStuff = () => {

        if (!isPlaying) return
        updateTextForTime(playerRef.getCurrentTime())
    }

    useAnimationFrame(syncStuff);

    const onProgress = ({playedSeconds, played}) => {
        setPlayed(played)
        setPlayedSeconds(playedSeconds)
    }

    const playerReady = (player) => {
        setPlayerRef(player)
        props.onReady(player)
        //playFromWord.current = playSeekFromWord
    }

    const updateTextForTime = (time = 0) => {

        const {clip} = props

        if (!clip.config.wordIds) return

        let word = null;
        for (let index = 0; index < clip.config.wordIds.length; index++) {
            word = clip.config.wordsById[clip.config.wordIds[index]];

            if (word.start <= time && time <= word.end) {
                break;
            }
        }

        const active = document.querySelector('.active-word')
        active && active.classList.remove('active-word')
        const elem = document.getElementById(word.id)
        elem && elem.classList.add('active-word')

        // this.setState({
        //     word,
        //     activeBlockId: word.blockId
        // })
    }

    const playSeekFromWord = (id) => {
        const {clip} = props

        if (!clip.config.wordsById) return

        const word = clip.config.wordsById[id]
        setCurrentTime(word.start)
        //setIsPlaying(true)
    }

    // React.useEffect(() => {
    //     playFromWord.current = playSeekFromWord
    // }, [playerRef])

    const onDuration = (_duration) => {
        setDuration(_duration)

        updateTextForTime(0)

    }

    const setCurrentTime = (seconds) => {
        playerRef.seekTo(seconds, 'seconds')
    }

    //const debouncePosChange = useDebounce(setCurrentTime, 500);
    const currentTime = playerRef && playerRef.getCurrentTime()

    const sliderChange = (val) => {
        setPlayed(val)
        playerRef.seekTo(val, 'fraction')
    }

    return (<div>
            {
                playerRef && <div className={'transcript-player'}>

                    <div className='transcript-player-progress'>
                        <label className='time-container'>

                            <TimeInput
                                onChange={setCurrentTime}
                                value={currentTime}
                                duration={duration}
                            />

                            <span className='duration'>{ TimeInput.getPlaybackTime(duration, 0) }</span>
                        </label>
                        <Slider
                            min={0}
                            max={1}
                            stepSize={0.02}
                            value={played}
                            labelRenderer={false}
                            //onChange={val => setPlayed(val)}
                            onRelease={sliderChange}
                        />
                    </div>

                    <div className='bu-buttons bu-is-centered'>

                        {/*<NiceButton  intent={Intent.PRIMARY} minimal={true} icon='backward' onClick={() => this.setCurrentTime(currentTime - 1)} />*/}

                        {
                            isPlaying ?
                                <NiceButton  intent={Intent.PRIMARY} minimal={true} className={'button-large-no-margin'} onClick={_ => setIsPlaying(false)} ><Icon icon="pause" iconSize={20} /></NiceButton> :
                                <NiceButton  intent={Intent.PRIMARY} minimal={true} className={'button-large-no-margin'} onClick={_ => setIsPlaying(true)} ><Icon icon="play" iconSize={20} /></NiceButton>
                        }

                        {/*<NiceButton  intent={Intent.PRIMARY} minimal={true} icon='forward' onClick={() => this.setCurrentTime(currentTime + 1)} />*/}

                    </div>
                </div>
            }
            <ReactPlayer
                ref={playerReady}
                width='100%'
                height={0}
                url={props.clip.audioUrl}
                playing={isPlaying}
                onProgress={onProgress}
                onDuration={onDuration}
                config={{
                    file: {
                        attributes: {
                            crossOrigin: 'true'
                        }
                    }
                }}
            />

        </div>
    )
}

class Transcript extends Component {

    constructor() {
        super()

        this.state = {

        }
    }

    componentDidMount() {
        this.loadForm()
        this.props.toggleMenu(null,true)
    }

    wordSelected = (id) => {

    }

    loadForm = async () => {

        const res = await this.props.dispatch(fetchClip(this.props.id))
        const clip = res.clip
        const {isSubtitles} = clip.config.globalSettings

        const {blocksById, blockIds, wordsById} = clip.config
        const textContent = blockIds.map(blockId => {
            let block = blocksById[blockId]
            const children = block.wordIds.map((wordId, index) => {
                let {word} = wordsById[wordId]
                const prefix = (index === 0 || isSubtitles ? '' : ' ')

                let editableWord = {
                    text: prefix + word ,
                    type: 'word',
                    id: wordId
                }

                if (wordsById[wordId].italic) {
                    editableWord.italic = true
                }

                return editableWord
            })
            return {
                type: 'paragraph',
                id: blockId,
                children
            }
        })

        this.props.dispatch(updateGlobal({
            isSubtitles: true
        }))

        this.setState({textContent})
    }

    saveContent = async (content) => {

        const {clip} = this.props

        let blockIds = [], wordIds = []
        let blocksById = {}, wordsById = clip.config.wordsById

        content.forEach(block => {
            let blockId = shortId.generate()
            blockIds.push(blockId)

            const words = Array.from(block.children)

            const lastWord = words[words.length - 1]
            //if empty character is the last char, we remove it
            if (lastWord.text && lastWord.text.trim() === ''){
                words.pop()
            }

            blocksById[blockId] = {
                id: blockId,
                wordIds: Array.from(new Set(words.map(word => word.id)))
            }

            words.forEach((word, index) => {
                const existing = wordsById[word.id]

                let {text} = word

                // if (text[0] === ' '){
                //     text = text.slice(1)
                // }
                // if (text === ' ' && index === block.children.length - 1) {
                //     return
                // }

                existing.blockId = blockId

                //if it's already added, we merge this one with previous
                if (wordIds.includes(word.id)) {
                    wordsById[word.id].word = existing.word + text
                }
                else {
                    wordsById[word.id].word = text
                    wordIds.push(word.id)
                }

                if (word.italic)
                    wordsById[word.id].italic = true

            })
        })

        //remove words that have been deleted
        Object.entries(wordsById).forEach(([key, word]) => {
            if (!blocksById[word.blockId]) {
                delete wordsById[word.id]
            }
        })

        // fix timing. Sometimes deleting words can create gaps which we don't want.
        // we thus realign words by matching the end of a word to the next words start
        wordIds.forEach((wordId, index) => {
            const currentWord = wordsById[wordId]
            const nextWord = wordsById[wordIds[index + 1]]

            if (nextWord && currentWord && currentWord.end < nextWord.start) {
                currentWord.end = nextWord.start
            }
        })

        clip.config.blockIds = blockIds
        clip.config.blocksById = blocksById
        clip.config.wordIds = wordIds
        clip.config.wordsById = wordsById

        //console.log(clip.config)

        const req = await axios.put(`/admin/api/clip/${this.props.id}`, {
            ...clip
        })
    }

    onReady = (player) => {
        this.playerRef = player
    }

    playFromWord = (id) => {
        const {clip} = this.props

        if (!clip.config.wordsById) return

        const word = clip.config.wordsById[id]
        this.playerRef.seekTo(word.start, 'seconds')
    }

    render() {

        return (

                <div>

                    {
                        this.state.textContent && <App
                            wordSelected={this.wordSelected}
                            content={this.state.textContent}
                            clip={this.props.clip}
                            saveContent={this.saveContent}
                            playFromWord={this.playFromWord}
                        />
                    }

                    {
                        this.props.clip && <Player
                            onReady={this.onReady}
                            clip={this.props.clip}
                        />
                    }

                </div>
        );
    }
}

Transcript.propTypes = {};

const mapStateToProps = state => {
    return {
        clipHistory: state.clip,
        clip: state.clip.present
    }
}

export default connect(mapStateToProps)(Transcript);