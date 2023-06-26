import React from 'react'
import Draggable from 'react-draggable'
import {Tree, Button, ButtonGroup, Intent, Classes, FormGroup, Tab, Tabs, H5, InputGroup, H4} from "@blueprintjs/core"
import GifControls from './gif-controls.jsx'
import BoxControls from "../../../shared/controls/box-controls"
import CustomIcons from "../../../shared/custom-icons"
import TimeInput from "../../../shared/controls/time-input.jsx"
import Panel from '../clip-editor/panel.jsx'
import {Utils as Util} from "../../../shared/utils"
import sortedIndexBy from "lodash/sortedIndexBy"
import Sidebar from "../shared/sidebar"
import Accordion from "../shared/accordion"
import TransitionControls from "./transition-controls"
import debounce from 'lodash/debounce'
import {Position} from "@blueprintjs/core/lib/esm/index"
import {Select} from '@blueprintjs/select'
import UI_TEXT from "../../ui-text"
import {renderGeneric} from "../../../shared/controls/custom-select"

const TABS = {
    GENERAL: 'general',
    EFFECTS: 'effects',
    TIMING: 'timing',
    LAYOUT: 'layout'
}

export default class MediaControls extends React.Component {

    constructor() {
        super();

        this.state = {
            mediaTab: TABS.LAYOUT,
            showTransition: false,
            hideTransition: false,
            transition: 'showTransition',
            blocks: [],
        }

        this.debounceSyncAnimation = debounce(this.syncAnimations, 50)
    }

    componentDidMount() {

        const { blockIds, blocksById, wordsById } = this.props

        if (!blockIds) return

        const blocks = blockIds.map(blockId => {
            let block = blocksById[blockId]
            const wordIds = block.wordIds
            const start = parseFloat(wordsById[wordIds[0]].start.toFixed(3))
            const end = parseFloat(wordsById[wordIds[wordIds.length - 1]].end.toFixed(3))

            const name = [0, 1, 2].map(i => wordIds[i] ? ` ${wordsById[wordIds[i]].word}` : '') + '...';

            return {
                start,
                end,
                name,
            }
        })

        this.setState({blocks})
    }

    onAnimationChange = (value, transitionType) => {
        const {selectedMediaId, onMediaChange} = this.props
        onMediaChange(selectedMediaId, {[transitionType]: value})
        this.debounceSyncAnimation()
    }

    syncAnimations = () => {
        const {syncAnimations} = this.props
        syncAnimations()
    }

    tabChange (transition) {
        this.setState({transition})
    }

    previewAnimation(selectedMediaId, property) {

        const {mediasById, dynamicArea} = this.props
        const updatedMedia = mediasById[selectedMediaId]
        const { imageStyle, general} = updatedMedia

        const animationObj = updatedMedia[property]

        const domElement = document.getElementById('media_preview_' + selectedMediaId)
        const isStart = (property === 'showTransition' || property === 'during')

        if (property === 'during') {
            const duration = general.timing === 'endtime'? Number(general.endtime) - Number(general.time) : + Number(general.duration)
            animationObj.duration = duration
        }

        Util.animateElement(domElement, imageStyle, animationObj, dynamicArea, isStart)
    }

    alignWithBlock = (block) => {
        const {selectedMediaId, onMediaChange} = this.props

        onMediaChange(selectedMediaId, {
            ['general']: {
                timing: 'endtime',
                time: block.start,
                endtime: block.end,
            }})
    }

    render() {

        const {transition, blocks} = this.state

        const {selectedMediaId, mediasById, mediaHelper, toggleAssets} = this.props
        const selectedMedia = mediasById[selectedMediaId]

        const MediaPropertyControl = (name, options, property, subprop, selected) => {

            const valueChange = (value) => {
                this.props.onMediaChange(selectedMediaId, {[property]: { [subprop]: value }})
            }

            return (<FormGroup label={name}>
                        <ButtonGroup className='bp3-small'>
                        {
                            options.map(propValue => {
                                const label = (typeof propValue === 'string' ? propValue : propValue.label);
                                const value = (typeof propValue === 'string' ? propValue : propValue.value);
                                const className = selected[property][subprop] === value ? 'bp3-active' : '';

                                return (<Button
                                    key={'v' + value}
                                    onClick={e => valueChange(value)}
                                    className={className}>
                                    {label}
                                </Button>)
                            })
                        }
                        </ButtonGroup>
                    </FormGroup>)
        }

        const timingOptions = [{
                label: 'Duration',
                value: 'duration'
            }, {
                label: 'End Time',
                value: 'endtime'
            }
        ]


        if (selectedMedia && selectedMedia.gifSettings && selectedMedia.gifSettings.loop === false) {
            // timingOptions.push({
            //     label: 'End of gif ',
            //     value: 'gif'
            // })
        }

        if (!selectedMedia || !mediaHelper) {
            return <div />
        }


        return (
            <Sidebar right={true} className='clip-sidebar'>

                <H4>Selected Media Properties</H4>

                <Accordion sections={[{
                    text: 'Image',
                    icon: 'duplicate',
                    content: <div>


                        <FormGroup label={'Name'}>
                            <InputGroup
                                placeholder="Name"
                                onChange={e => this.props.onMediaChange(selectedMediaId, {'name': e.target.value})}
                                value={selectedMedia.name} />
                        </FormGroup>

                        <FormGroup label={'Preview'} className={'media-preview'}>
                            <img className='image-preview' src={selectedMedia.url} />
                            <Button
                                className='media-replace-button'
                                intent={Intent.PRIMARY}
                                small={true}
                                text={'Change Image'}
                                onClick={toggleAssets}
                            />
                        </FormGroup>

                        {/*<Popover*/}
                            {/*content={}*/}
                            {/*position={Position.TOP}>*/}
                            {/*<Button*/}
                                {/*className={Classes.MINIMAL}*/}
                                {/*text={''}*/}
                                {/*intent={Intent.PRIMARY}*/}
                            {/*/>*/}
                        {/*</Popover>*/}






                        <Select
                            items={blocks}
                            popoverProps={{position: Position.BOTTOM}}
                            itemRenderer={renderGeneric}
                            onItemSelect={this.alignWithBlock}>
                            <Button
                                className={'margin-bottom'}
                                small={true}
                                intent={Intent.NONE}
                                text={'Align Timing With Block'}
                            />
                        </Select>




                        <FormGroup label={'Start Time'}>
                            <TimeInput
                                type="number"
                                onChange={seconds => this.props.onMediaChange(selectedMediaId, {general: {time : seconds}})}
                                className='player-bar-time'
                                value={selectedMedia.general.time}
                                leftIcon={'time'} />
                        </FormGroup>

                        {/*{*/}
                            {/*MediaPropertyControl(*/}
                                {/*'Hide media at',*/}
                                {/*timingOptions,*/}
                                {/*'general',*/}
                                {/*'timing',*/}
                                {/*selectedMedia*/}
                            {/*)*/}
                        {/*}*/}

                        {
                            selectedMedia.general.timing === 'duration' &&
                            <FormGroup label={'Duration'}>
                                <TimeInput
                                    precision={1}
                                    type="number"
                                    onChange={seconds => this.props.onMediaChange(selectedMediaId, {general: {duration : seconds}})}
                                    className='player-bar-time'
                                    value={selectedMedia.general.duration}
                                    leftIcon={'time'} />
                            </FormGroup>
                        }

                        {
                            selectedMedia.general.timing === 'endtime' &&
                            <FormGroup label={'End Time'}>
                                <TimeInput
                                    type="number"
                                    onChange={seconds => this.props.onMediaChange(selectedMediaId, {general: {endtime : seconds}})}
                                    className='player-bar-time'
                                    value={selectedMedia.general.endtime}
                                    leftIcon={'time'} />
                            </FormGroup>
                        }

                        {
                            selectedMedia.gifSettings &&
                            <div className='margin-top-20'>
                                <H5>Gif Settings</H5>
                                <GifControls
                                    config={selectedMedia.gifSettings}
                                    onChange={val => this.props.onMediaChange(
                                        selectedMediaId,
                                        {'gifSettings': val})
                                    }
                                />
                            </div>
                        }

                        <FormGroup label={'Actions'}>
                            <ButtonGroup>
                                <Button
                                    onClick={e => this.props.execMethod('shallow', 'centerH')}
                                    icon={'alignment-vertical-center'}
                                />
                                <Button
                                    onClick={e => this.props.execMethod('shallow', 'centerV')}
                                    icon={'alignment-horizontal-center'}
                                />
                            </ButtonGroup>
                        </FormGroup>

                        <BoxControls
                            selectedObject={mediaHelper}
                            updateBox={this.props.onMediaHelperChange}
                            scaleObject={this.props.scaleObject}
                        />

                        {
                            MediaPropertyControl(
                                'Layer depth (zIndex)',
                                [{
                                    label: '1 (back)',
                                    value: 1
                                },{
                                    label: '2',
                                    value: 2
                                },{
                                    label: '3 (front)',
                                    value: 3
                                }],
                                'general',
                                'zIndex',
                                selectedMedia
                            )
                        }
                    </div>
                }, {
                    text: 'Effects',
                    icon: 'clean',
                    isClosed: true,
                    content:  <Tabs selectedTabId={transition} onChange={this.tabChange.bind(this)}>
                        <Tab
                            id='showTransition'
                            title={'On Show'}
                            panel={<TransitionControls
                                transition={'showTransition'}
                                config={selectedMedia.showTransition}
                                onChange={value => this.onAnimationChange(value, 'showTransition')}
                                previewAnim={this.previewAnimation.bind(this, selectedMediaId, 'showTransition')}
                                selectScaleOrigin={_ => this.props.selectScaleOrigin('showTransition')}
                                scaleActive={this.props.scaleActive}
                            />}
                        />

                        <Tab
                            id='during'
                            title={'During'}
                            panel={<TransitionControls
                                transition={'during'}
                                config={selectedMedia.during}
                                onChange={value => this.onAnimationChange(value, 'during')}
                                previewAnim={this.previewAnimation.bind(this, selectedMediaId, 'during')}
                                selectScaleOrigin={_ => this.props.selectScaleOrigin('during')}
                                scaleActive={this.props.scaleActive}
                            />}
                        />

                        <Tab
                            id='hideTransition'
                            title={'On Hide'}
                            panel={<TransitionControls
                                transition={'hideTransition'}
                                config={selectedMedia.hideTransition}
                                onChange={value => this.onAnimationChange(value, 'hideTransition')}
                                previewAnim={this.previewAnimation.bind(this, selectedMediaId, 'hideTransition')}
                                selectScaleOrigin={_ => this.props.selectScaleOrigin('hideTransition')}
                                scaleActive={this.props.scaleActive}
                            />}
                        />
                    </Tabs>
                }
                ]}

                />

            </Sidebar>
        )
    }
//
//     ['showTransition', 'hideTransition'].map(property => {
//
//     const direction = property === 'showTransition'? 'From':'To'
//     const scale = property === 'showTransition'? 'Up':'Down'
//     const isOpen = this.state[property];
//
//     return (<div key={'effect-'+property}>
// <Button
// onClick={_ => this.previewAnimation(selectedMedia, property)}
// className='push-right'
// minimal={true}
// text={'Test Animation'}
// small={true}
// intent={Intent.PRIMARY}
// />
// <H5 className='bp3-label'>{'showTransition' === property? 'Appear' : 'Disappear'}</H5>
//
// {
//     MediaPropertyControl(
//         'Animation Type',
//         [
//             {label: `Opacity`, value: 'opacity'},
//             {label: `Scale ${scale}`, value: 'scale'},
//             {label: `${direction} Left`, value: 'left'},
//             {label: `${direction} Right`, value: 'right'},
//             {label: `${direction} Top`, value: 'up'},
//             {label: `${direction} Bottom`, value: 'down'}
//         ],
//         property,
//         'cssProperty',
//         selectedMedia
//     )
// }
//
// {
//     MediaPropertyControl(
//         'Motion style',
//         ['Sine', 'Expo', 'Power2', 'Power4', 'Back', 'SlowMo', 'Bounce', 'Elastic'],
//         property,
//         'easing',
//         selectedMedia
//     )
// }
//
// {
//     MediaPropertyControl(
//         'Acceleration',
//         ['easeIn', 'easeInOut', 'easeOut'],
//         property,
//         'type',
//         selectedMedia
//     )
// }
// </div>)
// })


}