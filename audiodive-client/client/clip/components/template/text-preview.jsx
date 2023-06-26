import React from 'react'
import {Alignment} from "@blueprintjs/core"
import ContentEditable from 'react-contenteditable'
import {Utils} from "../../../shared/utils"
import Textfit from '../../../shared/TextFit';

export default class TextPreview extends React.Component {

    constructor() {
        super()
    }

    state = {
        textFitStyle: {}
    }

    componentDidUpdate(nextProps, prevState) {
        ['selectedWord', 'selectedBlock'].forEach(key => {
            if (nextProps[key] !== this.props[key]) {
                //console.log('change', key, nextProps[key])
                //this.previewWordAnim()
            }
        })

        if (nextProps.textArea !== this.props.textArea &&
            nextProps.textArea.height !== this.props.textArea.height) {
            this.setContainerHeight()
        }
    }

    componentDidMount() {
        const el = document.getElementById(this.props.id)
        if (el)
            el.style.visibility = 'hidden'

        this.setContainerHeight()
    }

    setContainerHeight = () => {
        this.setState({
            textFitStyle: {
                height: `${this.props.textArea.height}px`
            }})
    }

    render() {

        const {textFitStyle} = this.state

        const {
            allWordsById,
            blocksById,
            blockIds,
            textArea,
            selectedWord,
            selectedBlock,
            viewMode,
            playing,
            onlyShowBlocks
        } = this.props

        const activeWord = selectedWord && allWordsById[selectedWord.id]
        const activeBlock = activeWord && blocksById && blocksById[activeWord.blockId]

        let selectedBlockConfig = {}
        if (activeBlock && activeBlock.customStyles) {
            selectedBlockConfig = activeBlock.customStyles
        }

        if (selectedBlock && selectedBlock.customStyles) {
            selectedBlockConfig = selectedBlock.customStyles
        }

        const cascadedConfig = Object.assign(
            {},
            textArea
        )

        let textAreaStyle = Utils.getStyles(cascadedConfig)

        //textAreaStyle.zIndex = 10

        if (!this.props.viewMode) {
            //delete textAreaStyle.backgroundColor
        }

        if (this.props.mediaActive) {//if (selectedBlock && selectedBlock.muted || this.props.mediaActive || this.props.activeBlock && this.props.activeBlock.muted) {
            textAreaStyle.display = 'none'
        }

        const maxFontSize = parseInt(textArea.fontSize || 50) + 10

        return (<div
            id={this.props.id}
            className={'textElement ' + (selectedBlock? 'selected':'')}
            style={textAreaStyle}>


            {
                blockIds.map(blockId => {

                    const block = blocksById[blockId]
                    const customStyles = block.customStyles ?  block.customStyles : {}
                    const blockStyle = Utils.getStyles(customStyles)
                    blockStyle.height = textAreaStyle.height

                    if (onlyShowBlocks && !onlyShowBlocks.includes(blockId)) {
                        blockStyle.visibility = 'hidden'
                    }

                    return <div
                        id={blockId}
                        className={'textBlock'}
                        style={blockStyle}
                        //style={{visibility: (selectedBlock && blockId === selectedBlock.id? 'visible':'hidden')}}
                        key={blockId}>
                        {/*<Textfit max={maxFontSize} mode="multi" style={textFitStyle}>*/}

                        {
                            block.wordIds.map(wordId => {
                                const word = allWordsById[wordId]

                                if (!word) {
                                    return <span key={wordId} />
                                }

                                const style = Utils.getStyles(word.customStyles || {})
                                const className = (selectedWord && !playing && viewMode && wordId === selectedWord.id? `${wordId} selected` : wordId)

                                return <span
                                    //onClick={e => this.props.onWordSelect(wordId) }
                                    id={`word_${wordId}`}
                                    key={wordId}
                                    className={className}
                                    style={style}>
                                    {word.word}
                                </span>
                            })
                        }

                        {/*</Textfit>*/}
                    </div>
                })
            }
        </div>)
    }
}