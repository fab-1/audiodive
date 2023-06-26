import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Button, Classes, ControlGroup, H4, InputGroup, Intent, Tab, Tabs, Label} from "@blueprintjs/core"
import Sticky from 'react-sticky-el'
import ClipBlock from './clip-block'
import Accordion from '../shared/accordion'
import TextControls from '../template/text-controls'
import CustomIcons from "../../../shared/custom-icons"
import Sidebar from '../shared/sidebar'
import {debounce} from "lodash"

const SECTIONS = {
    CLIP: 'preview',
    TRANSCRIPT: 'transcript',
    TEMPLATE: 'template'
}

class ClipTranscript extends Component {

    state = {
        wordTab: 'tab1'
    }

    constructor(props) {
        super(props)
        this.debounceUpdateWord = debounce(this.updateWord, 800)
    }

    updateWord = (selectedWordId, key, value) => this.props.onWordChange(selectedWordId, key, value)

    render() {

        const {
            templates,
            selectedBlock,
            selectedWord,
            selectedWordId,
            templateConfig,
            fonts,
            isMusic,
            activeRegion,
            mainLayoutId,
            wavesurfer,
            activeTab,
            playing,
            clip,
            loadFont,
            updateBlock,
            onWordChange,
            onWordDelete,
            onWordSplit,
            addBlockOrWord,
            toggleImportLyrics,
            onWordSelect,
            onBlockSplit,
            onBlockMerge,
            onToggleShiftBlock,
            onBlockClone,
            onBlockDelete

        } = this.props

        const {
            wordTab,
            fill
        } = this.state

        return (
            <Sidebar
                id={'transcript-container'}
                className={'sidebar-scroll'}
                fill={fill}
                right={true}
                large={true}
            >

                <Button
                    text={fill? 'Minimize': 'Full Screen'}
                    minimal={true}
                    onClick={e => this.setState({fill: !fill})}
                    icon={fill? 'drawer-left': 'drawer-right'}
                />

                <Button
                    className='push-right'
                    intent={Intent.PRIMARY}
                    onClick={addBlockOrWord}
                    text={'Insert Word/Text Block'}
                    icon="add-to-artifact"
                />

                {/*<Button*/}
                    {/*large={true}*/}
                    {/*className='push-right'*/}
                    {/*onClick={toggleImportLyrics}*/}
                    {/*text={'Import Lyrics'}*/}
                    {/*icon="import"*/}
                {/*/>*/}

                <Tabs
                    animate={true}
                    large={true}
                    className='margin-top-20 margin-bottom-20'
                    onChange={v => this.setState({wordTab: v})}
                    selectedTabId={wordTab}
                >
                    <Tab id="tab1" title="Transcript/Lyrics" />
                    <Tab id="tab2" title="Word and Block Style" />
                </Tabs>

                {
                    selectedBlock && <div>
                        <Sticky
                            stickyClassName={'selected-word-sticky'}
                            stickyStyle={{zIndex:10, marginTop: '52px'}}
                            scrollElement={'.sidebar-scroll'}
                            topOffset={-52}>
                            <div className={'padding-top padding-bottom'}>
                                <ControlGroup>
                                    <InputGroup
                                        className={Classes.FILL}
                                        onChange={e => onWordChange(selectedWordId, 'word', e.target.value)}
                                        value={selectedWord['word']}
                                    />
                                    <Button
                                        intent={Intent.PRIMARY}
                                        text={'Split'}
                                        icon="split-columns"
                                        disabled={selectedWord.word && selectedWord.word.indexOf(' ') === -1}
                                        onClick={e => onWordSplit(selectedWordId)}
                                    />
                                    <Button
                                        intent={Intent.DANGER}
                                        icon={'trash'}
                                        onClick={() => onWordDelete(selectedWordId)}
                                    />
                                </ControlGroup>
                                <ControlGroup className="margin-top-10">
                                    <Button disabled>Start Time</Button>
                                    <InputGroup
                                        className={Classes.FILL}
                                        onChange={e => this.debounceUpdateWord(selectedWordId, 'start', e.target.value)}
                                        value={selectedWord['start']}
                                    />
                                    <Button disabled>End Time</Button>
                                    <InputGroup
                                        className={Classes.FILL}
                                        onChange={e => this.debounceUpdateWord(selectedWordId, 'end', e.target.value)}
                                        value={selectedWord['end']}
                                    />
                                </ControlGroup>
                            </div>

                        </Sticky>

                        {
                            wordTab === 'tab2' && !playing && <Accordion sections={[
                                {
                                    text: 'Customize Word',
                                    isClosed: true,
                                    content: templateConfig.linkedElements.textArea && <div>
                                        <Button
                                            className='margin-bottom-10'
                                            icon={CustomIcons.clearFormat}
                                            text={'Clear Word Customization'}
                                            disabled={!Object.keys(selectedWord.customStyles || {}).length}
                                            onClick={e => onWordChange(selectedWord.id, 'customStyles', null)}
                                        />

                                        <TextControls
                                            textConfig={templateConfig.linkedElements.textArea}
                                            overrideConfig={selectedWord['customStyles'] || {}}
                                            onTextConfigChange={updates =>  onWordChange(selectedWord.id, 'customStyles', updates)}
                                            fonts={fonts}
                                            customizeMode={true}
                                            loadFont={loadFont}
                                        />

                                    </div>
                                }, {
                                    text: 'Customize Block',
                                    isClosed: true,
                                    content:
                                        templateConfig.linkedElements.textArea &&

                                        <div>

                                            <Button
                                                icon={CustomIcons.clearFormat}
                                                text={'Clear Block Customization'}
                                                disabled={!Object.keys(selectedBlock.customStyles || {}).length}
                                                onClick={e => updateBlock(selectedBlock.id, {'customStyles': null})}
                                            />

                                            <TextControls
                                                textConfig={templateConfig.linkedElements.textArea}
                                                overrideConfig={selectedBlock['customStyles'] || {}}
                                                onTextConfigChange={updates =>  updateBlock(selectedBlock.id, {'customStyles': updates})}
                                                fonts={fonts}
                                                customizeMode={true}
                                                loadFont={loadFont}
                                            />
                                        </div>


                                }]}/>
                        }


                        {
                            wordTab === 'tab1' && <div className={'transcript-editor-small'}>
                                <H4>Transcript</H4>
                                {
                                    clip.config.blockIds && clip.config.blockIds.map(blockId => {
                                        const block = clip.config.blocksById[blockId]

                                        return (<ClipBlock
                                            key={block.id}
                                            block={block}
                                            isMusic={isMusic}
                                            showPopup={false}
                                            templates={templates}
                                            wordsById={clip.config.wordsById}
                                            onClipSelection={onWordSelect}
                                            activeWordId={activeRegion && activeRegion.id}
                                            onWordDelete={onWordDelete}
                                            onWordSplit={onWordSplit}
                                            onWordChange={onWordChange}
                                            splitBlock={onBlockSplit}
                                            mergeBlock={onBlockMerge}
                                            blockPropertyChange={updateBlock}
                                            templateId={mainLayoutId}
                                            mute={activeTab === SECTIONS.CLIP && playing}
                                            onTimeChange={time => wavesurfer.setCurrentTime(time + 0.1)}
                                            selectedBlock={selectedBlock}
                                            toggleShiftBlock={onToggleShiftBlock}
                                            cloneBlock={onBlockClone}
                                            deleteBlock={onBlockDelete}
                                        />)
                                    })
                                }
                            </div>
                        }
                    </div>
                }

            </Sidebar>
        );
    }
}

ClipTranscript.propTypes = {};

export default ClipTranscript;