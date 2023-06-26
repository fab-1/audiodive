import * as Scroll from 'react-scroll';
import React from 'react';
import {Suggest, Select} from '@blueprintjs/select'
import ValidatedForm from '../shared/validated-form.jsx';
import update from "immutability-helper/index";
import {
    Alert,
    Breadcrumb,
    Button,
    ButtonGroup,
    Label,
    Icon,
    Intent,
    Menu,
    MenuItem,
    NumericInput,
    Popover,
    Position, FormGroup
} from "@blueprintjs/core"
import {filterGeneric, renderGeneric} from "../../../shared/controls/custom-select"
import TimeInput from "../../../shared/controls/time-input.jsx"

const Element    = Scroll.Element;

class ClipBlock extends ValidatedForm(React.Component) {

    constructor() {
        super();
    }

    state = {
        confirmShiftBlock: false
    }

    componentDidMount() {
        //console.log('mounted')
    }

    shouldComponentUpdate(nextProps, nextState){


        if (nextProps.activeWordId !== this.props.activeWordId) {

            //only render block if word is involved
            const hasNewWord = this.props.block.wordIds.indexOf(nextProps.activeWordId) > -1;
            const hasOldWord = this.props.block.wordIds.indexOf(this.props.activeWordId) > -1;

            return hasNewWord || (hasOldWord && nextProps.activeWordId != null);
        }

        if (nextProps.mute) {
            return false
        }

        if (nextProps.layouts !== this.props.layouts) {
            return true;
        }

        if (nextState.confirmShiftBlock !== this.state.confirmShiftBlock) {
            return true;
        }

        if (nextProps.block !== this.props.block) {
            return true;
        }

            //Active Word being edited
        if (this.props.activeWordId &&
            //This word is part of this block
            this.props.block.wordIds.indexOf(this.props.activeWordId) > -1 &&
            //The word text was changed
            this.props.wordsById[this.props.activeWordId].word !== nextProps.wordsById[this.props.activeWordId].word)
        {
            return true
        }

        return false
    }

    onBlockEdit(event, wordIndexInBlock, isFirst, isLast) {

        if (event.shiftKey) {
            return
        }

        //console.log('on block edit', isFirst, isLast);
        const charIndex = event.target.selectionStart;

        const isLastChar = event.target.value.length == charIndex;
        const isFirstChar = 0 === charIndex;

        if (event.key == 'ArrowRight' && isLastChar && !isLast) {
            this.props.onClipSelection(this.props.block.wordIds[wordIndexInBlock+1]);
            event.preventDefault();
        }

        if (event.key == 'ArrowLeft' && isFirstChar && !isFirst) {
            this.props.onClipSelection(this.props.block.wordIds[wordIndexInBlock-1]);
            event.preventDefault();
        }

        // if (event.key == ' ') {
        //     this.props.splitWord(this.props.block.id, wordIndexInBlock, event.target.selectionStart);
        //     event.preventDefault();
        // }

        if (isFirstChar && event.key == 'Enter') {
            this.props.splitBlock(this.props.block.id, wordIndexInBlock);
            event.preventDefault();
        }

        if (isLastChar && event.key == 'Enter' && !isLast) {
            this.props.splitBlock(this.props.block.id, wordIndexInBlock+1);
            event.preventDefault();
        }

        if (isFirstChar && isFirst && event.key == 'Backspace') {
            this.props.mergeBlock(this.props.block.id, wordIndexInBlock);
            event.preventDefault();
        }

    }

    toggleShiftBlock = () => {
        this.setState({confirmShiftBlock: !this.state.confirmShiftBlock})
    }

    onPaste = (e)  => {
        const {activeWordId, wordsById} = this.props

        if (!activeWordId) return

        const word = wordsById[activeWordId]

        const length = e.clipboardData.getData('Text').length * 0.3

        this.props.onWordChange(activeWordId, 'end', word.start + length)
    }

    render() {

        const {templates, block, templateId, wordsById, showPopup, selectedBlock, isMusic} = this.props

        let selectedLayoutId = block.layout || templateId

        const layout = templates && templates.find(layout => layout.id === selectedLayoutId)
        const isDefaultLayout = !block.layout

        const firstWord = wordsById[block.wordIds[0]]

        const SPEAKERS = {
            '1': 'Speaker A',
            '2': 'Speaker B'
        }

        return (
            <div id={`tr-${block.id}`} className={'clip-block'}>


                <div className='flex space-between margin-bottom-10'>
                    {
                        (firstWord && firstWord.start !== undefined) && <Button
                            minimal={true}
                            intent={Intent.PRIMARY}
                            onClick={e => this.props.onTimeChange(firstWord.start + 0.05)}>
                            {TimeInput.getPlaybackTime(firstWord.start)}
                        </Button>
                    }


                    {
                        !isMusic && <Popover
                            position={Position.BOTTOM_RIGHT}
                            content={<div className='padding'>
                                <Button
                                    icon={"duplicate"}
                                    intent={Intent.PRIMARY}
                                    minimal={true}
                                    onClick={_ => this.props.cloneBlock(block)}
                                >Clone Block</Button>
                                <Button
                                    minimal={true}
                                    onClick={_ => this.props.toggleShiftBlock(block)}
                                >Shift Block to cursor</Button>
                                <Button
                                    icon={"duplicate"}
                                    intent={Intent.DANGER}
                                    minimal={true}
                                    onClick={_ => this.props.deleteBlock(block)}
                                >Delete</Button>
                            </div>}
                        >
                            <Button icon={'more'} minimal={true} />
                        </Popover>
                    }

                    {
                        !isMusic && false && <div>
                            <Popover
                                position={Position.BOTTOM}
                                content={<Menu>
                                    <MenuItem active={!SPEAKERS[block.speakerTag]} text={'Not Assigned'}
                                              onClick={_ => this.props.blockPropertyChange(block.id, {speakerTag: undefined})}
                                    />
                                    {
                                        Object.entries(SPEAKERS).map(([id, text]) => <MenuItem
                                            key={id}
                                            active={parseInt(id) === block.speakerTag}
                                            text={text}
                                            onClick={_ => this.props.blockPropertyChange(block.id, {speakerTag: parseInt(id)})}
                                        />)
                                    }</Menu>}>
                                <Button minimal={true} small={true} icon="person" text={SPEAKERS[block.speakerTag] || 'Not Assigned'} />
                            </Popover>
                            {
                                templates && false &&
                                <Select
                                    noResults={<MenuItem disabled={true} text="No results." />}
                                    items={templates}
                                    activeItem={layout}
                                    popoverProps={{position: Position.RIGHT, minimal: true}}
                                    itemPredicate={filterGeneric}
                                    itemRenderer={renderGeneric}
                                    onItemSelect={layout => this.props.blockPropertyChange(block.id, {layout: layout.id})}>

                                    <button className="bp3-button bp3-icon-style bp3-minimal button-text-overflow-ellipsis">
                                        <span className='bp3-button-text'>{isDefaultLayout ? 'Template' : layout.name}</span>
                                    </button>
                                </Select>
                            }
                        </div>
                    }


                </div>


                <div className={'clip-block-words '}>
                    {
                        this.props.block.wordIds.map((wordId, wordIndex) => {

                            const selected = this.props.activeWordId === wordId

                            const word = wordsById[wordId]
                            if (!word) {
                                return (<span key={'zonbie'}>(zombie)</span>)
                            }

                            const selectedClass = selected?`word-selected`:''
                            const hasStartClass = word.start !== undefined? `word-has-start`:``
                            const inputclass = `bp3-input ${selectedClass} ${hasStartClass}`

                            return (<span key={wordId} className="word-input-container">
                                    <input
                                        name="word"
                                        placeholder="empty"
                                        required={true}
                                        autoComplete="off"
                                        id={wordId}
                                        onKeyDown={(e) => this.onBlockEdit(e, wordIndex, wordIndex === 0, this.props.block.wordIds.length - 1 === wordIndex)}
                                        className={inputclass}
                                        onClick={e => this.props.onClipSelection(wordId, true)}
                                        onPaste={this.onPaste}
                                        size={word.word.length + 1}
                                        type="text"
                                        onChange={event => this.props.onWordChange(wordId, 'word', event.target.value)}
                                        value={word.word}
                                    />

                                    {
                                        selected && showPopup &&
                                        <span className="word-input-delete">

                                            <ButtonGroup className={'margin-10'}>
                                                <Button
                                                    intent={Intent.PRIMARY}
                                                    icon="split-columns"
                                                    disabled={word.word && word.word.indexOf(' ') === -1}
                                                    onClick={e => this.props.onWordSplit(word.id)}
                                                />
                                                <Button
                                                    intent={Intent.DANGER}
                                                    icon={'trash'}
                                                    onClick={() => this.props.onWordDelete(wordId, this.props.block.id, wordIndex)}
                                                />
                                            </ButtonGroup>

                                        </span>
                                    }

                                </span>)
                        })
                    }
                </div>


                {/*<div className={'clip-block-settings' }>*/}
                    {/*{*/}
                        {/*templates &&*/}
                        {/*<Select*/}
                            {/*noResults={<MenuItem disabled={true} text="No results." />}*/}
                            {/*items={templates}*/}
                            {/*popoverProps={{*/}
                                {/*position: Position.BOTTOM*/}
                            {/*}}*/}
                            {/*itemPredicate={filterGeneric}*/}
                            {/*itemRenderer={renderGeneric}*/}
                            {/*onItemSelect={v => this.props.blockPropertyChange(block.id, {layout: (v?v.id:0)})}>*/}

                            {/*<Button*/}
                                {/*minimal={true}*/}
                                {/*intent={Intent.PRIMARY}*/}
                                {/*className='bp3-fill'*/}
                                {/*rightIcon='chevron-down'*/}
                                {/*text={layout ? layout.name : 'Default Template'} />*/}

                        {/*</Select>*/}
                    {/*}*/}

                {/*</div>*/}
            </div>
        )

    }
}

export default ClipBlock;