import React from 'react'
import ColorPicker from './color-picker.js'
// import 'react-virtualized/styles.css'
// import 'react-virtualized-select/styles.css'
// import VirtualizedSelectModule from 'react-virtualized-select'
// const VirtualizedSelect = VirtualizedSelectModule.default
import {Alignment, Button, ButtonGroup, NumericInput, Tab, Tabs, Icon, Classes, FormGroup, Label, MenuItem} from "@blueprintjs/core"
import {Select} from '@blueprintjs/select'
import UI_TEXT from '../../ui-text'
import {Position} from "@blueprintjs/core/lib/esm/index"
import {filterGeneric, renderFont, renderGeneric} from "../../../shared/controls/custom-select"
import isArray from 'lodash/isArray'


const TEXT_PROPERTIES = [
    'display',
    'fontFamily',
    'color',
    'fontSize',
    'fontWeight',
    'backgroundColor',
    'fontStyle',
    'textShadowColor',
    'textShadowOffsetX',
    'textShadowOffsetY',
    'textShadowBlur',
    'textDecoration',
    'textTransform',
    'textAlign',
    'alignItems',
    'lineHeight',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'borderWidth',
    'borderColor',
    'transform'
]

const TEXT_OPTIONS = TEXT_PROPERTIES.map(prop => {
    return {
        value: prop,
        name: prop
    }
})

const CustomNumericInput  = (props) => {

    const {label, prop, value, className, onTextConfigChange, stepSize=1} = props

    return <FormGroup label={label} className={className}>
        <NumericInput
            fill={true}
            onValueChange={(v, val) => onTextConfigChange({[prop] : val})}
            value={value}
            stepSize={stepSize}
        />
    </FormGroup>
}




class TextControls extends React.Component {

    constructor() {
        super();

        this.state = {
            subPanel: 'styles',
            animPanel: false
        }
    }

    componentDidMount() {
        this.setState({subPanel: 'styles'})
    }

    handleTabChange(tab) {
        this.setState({subPanel: tab})
    }

    onFontChange(v) {

        const {textConfig, onTextConfigChange, loadFont} = this.props

        let updates = {fontFamily: v.value, fontVariants: v.variants}
        if (v.variants && v.variants.length === 1 && !isNaN(v.variants[0])) {
            updates.fontWeight = v.variants[0]
        }

        onTextConfigChange(updates)
        loadFont(Object.assign({}, textConfig, {fontFamily: v.value}))
    }

    CustomizedControl = (props) => {

        const {overrideConfig, customizeMode} = this.props

        let hasProperty = false

        if (overrideConfig) {
            hasProperty = overrideConfig[props.property] !== undefined
            if (isArray(props.property)) {
                props.property.forEach((value) => {
                    if (overrideConfig[value] !== undefined) {
                        hasProperty = true
                    }
                })
            }
        }

        const showControl = !customizeMode || hasProperty

        return showControl? props.children:<span />
    }


    render() {

        const {readOnly, textConfig, overrideConfig, customizeMode, isStatic, fonts} = this.props

        const getPropClass = (prop) => {
            if (overrideConfig) {
                return (overrideConfig[prop] ? 'is-override':'')
            }
            return ''
        }

        const getValue = (prop, defaultValue) => {
            if (overrideConfig && overrideConfig[prop]) {
                return (overrideConfig[prop] !== undefined? overrideConfig[prop] : textConfig[prop])
            }
            return textConfig[prop] || defaultValue;
        }

        const ButtonsGroup = (name = '', options, property, value) => {

            const buttons = options.map(option => {
                return (<Button
                    disabled={readOnly}
                    active={option.value === value}
                    key={option.value}
                    onClick={e => this.props.onTextConfigChange({[property]: option.value})}>
                    {option.text || option.value}
                </Button>);
            })

            return (<FormGroup disabled={readOnly} label={name} className={getPropClass(property)}>
                <ButtonGroup disabled={readOnly}>
                    {
                        buttons
                    }
                </ButtonGroup>
            </FormGroup>)
        }





        let fontWeightOptions = [{ text: 'Normal', value: '400'},{text: 'Bold', value: '600'}]
        const fontFamily = overrideConfig && overrideConfig.fontFamily? overrideConfig.fontFamily:textConfig.fontFamily
        const fontObject = this.props.fonts && this.props.fonts.find(font => font.fontFamily === fontFamily)
        if (fontObject && fontObject.variants) {
            fontObject.variants.forEach(fontVariant => {


                if (!isNaN(fontVariant) && !fontWeightOptions.find(w => w.value === fontVariant)) {

                    let option = {value: fontVariant}
                    if (fontVariant === '300') {
                        option.text = 'Light'
                    }
                    fontWeightOptions.push(option)
                }
            })
        }

        const activeFont = fonts && fonts.find(f => f.fontFamily === getValue('fontFamily'))

        return (
            <div>
                <div>
                    {
                        customizeMode &&
                        <Select
                            popoverProps={{
                                position: Position.BOTTOM_RIGHT,
                                targetTagName: 'div'
                            }}
                            noResults={<MenuItem disabled={true} text="No results." />}
                            items={TEXT_OPTIONS}
                            itemPredicate={filterGeneric}
                            itemRenderer={renderGeneric}
                            onItemSelect={property => {
                                this.props.onTextConfigChange({[property.value]: ''})
                            }}>

                            <Button
                                fill={true}
                                className='margin-bottom'
                                //onClick={e => this.setState({isOpen: !isOpen})}
                                rightIcon={'caret-down'}>Customize Property</Button>

                        </Select>
                    }

                    <this.CustomizedControl property={'display'}>
                        {
                            ButtonsGroup('Text Layout',
                                [{value: 'block'}, {value: 'inline'}],
                                'display', getValue('display', 'block'))
                        }
                    </this.CustomizedControl>

                    <this.CustomizedControl property={'fontFamily'}>
                        <FormGroup
                            className={getPropClass('fontFamily')}
                            label={<span>
                            Font (<a href='https://fonts.google.com/' target='_blank'>browse</a>)
                                {
                                    this.props.fontChange &&
                                    <label
                                        className={Classes.MINIMAL + ' push-right'}>
                                        <Icon icon={'upload'} />
                                        <input onChange={this.props.fontChange} accept={'.ttf, .eot, .otf, .woff, .woff2'} type="file" hidden />
                                    </label>
                                }
                        </span>}>

                            <Select
                                noResults={<MenuItem disabled={true} text="No results." />}
                                items={fonts}
                                activeItem={activeFont}
                                popoverProps={{position: Position.BOTTOM_RIGHT, minimal: true}}
                                itemPredicate={filterGeneric}
                                itemRenderer={renderFont}
                                onItemSelect={this.onFontChange.bind(this)}>
                                <button className="bp3-button bp3-icon-style bp3-minimal">
                                    <span className='bp3-button-text'>{getValue('fontFamily')}</span>
                                </button>
                            </Select>

                            {/*<VirtualizedSelect*/}
                                {/*menuIsOpen={true}  onMenuOpen={e => {}} onMenuClose={e => {}}*/}
                                {/*disabled={readOnly}*/}
                                {/*clearable={false}*/}
                                {/*options={this.props.fonts}*/}
                                {/*onChange={this.onFontChange.bind(this)}*/}
                                {/*value={getValue('fontFamily')}*/}
                            {/*/>*/}
                        </FormGroup>
                    </this.CustomizedControl>


                    <this.CustomizedControl property={'color'}>
                        <ColorPicker
                            disabled={readOnly}
                            className={getPropClass('color')}
                            label={'Text Color'}
                            value={getValue('color')}
                            handleColorChange={ color => this.props.onTextConfigChange({'color': color}) }
                        />
                    </this.CustomizedControl>

                    <this.CustomizedControl property={'fontSize'} key={'fontSize'}>
                        <CustomNumericInput
                            label="Text Size"
                            prop="fontSize"
                            value={getValue('fontSize')}
                            className={getPropClass('fontSize')}
                            onTextConfigChange={this.props.onTextConfigChange}
                        />
                    </this.CustomizedControl>

                    <this.CustomizedControl property={'fontWeight'}>
                        {ButtonsGroup('Font Weight', fontWeightOptions, 'fontWeight', getValue('fontWeight'))}
                    </this.CustomizedControl>


                    <this.CustomizedControl property={'fontStyle'}>
                        {ButtonsGroup('Font Style', [
                            {value: 'normal'},
                            {value: 'italic'}], 'fontStyle', getValue('fontStyle', 'normal'))}
                    </this.CustomizedControl>

                    <this.CustomizedControl property={'backgroundColor'}>
                        <ColorPicker
                            disabled={readOnly}
                            className={getPropClass('backgroundColor')}
                            label={'Background Color'}
                            value={getValue('backgroundColor')}
                            handleColorChange={ color => this.props.onTextConfigChange({'backgroundColor': color}) }
                        />
                    </this.CustomizedControl>

                    <FormGroup label={'Background Image'}>
                        <img className='image-preview' src={getValue('backgroundImage')} />
                        <Button text={'Change Image'} onClick={e => this.props.toggleAssets(textConfig)} />
                    </FormGroup>

                    <this.CustomizedControl property={'textShadowColor'}>
                        <FormGroup label='Text Shadow' >

                            <ColorPicker
                                disabled={readOnly}
                                className={getPropClass('textShadowColor')}
                                label={'Shadow Color'}
                                value={getValue('textShadowColor')}
                                handleColorChange={ color => this.props.onTextConfigChange({'textShadowColor': color}) }
                            />

                            <div className="box-controls">
                                <CustomNumericInput
                                    label="X Offset"
                                    prop="textShadowOffsetX"
                                    value={getValue('textShadowOffsetX')}
                                    className={getPropClass('textShadowOffsetX')}
                                    onTextConfigChange={this.props.onTextConfigChange}
                                />

                                <CustomNumericInput
                                    label="Y Offset"
                                    prop="textShadowOffsetY"
                                    value={getValue('textShadowOffsetY')}
                                    className={getPropClass('textShadowOffsetY')}
                                    onTextConfigChange={this.props.onTextConfigChange}
                                />

                                <CustomNumericInput
                                    label="Blur"
                                    prop="textShadowBlur"
                                    value={getValue('textShadowBlur')}
                                    className={getPropClass('textShadowBlur')}
                                    onTextConfigChange={this.props.onTextConfigChange}
                                />

                            </div>
                        </FormGroup>
                    </this.CustomizedControl>


                    <this.CustomizedControl property={'textDecoration'}>
                        {
                            ButtonsGroup('Text Decoration', [
                                {value: 'underline'},
                                {value: 'none'}], 'textDecoration', getValue('textDecoration', 'none'))
                        }
                    </this.CustomizedControl>

                    <this.CustomizedControl property={'textTransform'}>
                        {
                            ButtonsGroup('Capitalize', [{value: 'capitalize'},
                                {value: 'uppercase'},
                                {value: 'none'}], 'textDecoration', getValue('textTransform', 'none'))
                        }
                    </this.CustomizedControl>


                    <this.CustomizedControl property={'textAlign'}>
                        {
                            ButtonsGroup('Horizontal Alignment', [
                                {value: 'left'},
                                {value: 'center'},
                                {value: 'right'}], 'textAlign', getValue('textAlign'))
                        }
                    </this.CustomizedControl>

                    <this.CustomizedControl property={'verticalAlign'}>
                        {
                            ButtonsGroup('Vertical Alignment', [
                                {value: 'top', text: 'Top'},
                                {value: 'center', text: 'Center'},
                                {value: 'flex-end', text: 'Bottom'}], 'verticalAlign', getValue('verticalAlign', 'top'))
                        }
                    </this.CustomizedControl>

                    <this.CustomizedControl property={'lineHeight'}>
                        <div className="box-controls-single">
                            <CustomNumericInput
                                label="Line Height"
                                prop="lineHeight"
                                value={getValue('lineHeight')}
                                className={getPropClass('lineHeight')}
                                onTextConfigChange={this.props.onTextConfigChange}
                                stepSize={0.1}
                            />
                        </div>
                    </this.CustomizedControl>

                    <this.CustomizedControl property={['paddingTop','paddingBottom']}>
                        <Label>Padding</Label>
                        <div className="box-controls">

                            <CustomNumericInput
                                label="Top"
                                prop="paddingTop"
                                value={getValue('paddingTop')}
                                className={getPropClass('paddingTop')}
                                onTextConfigChange={this.props.onTextConfigChange}
                            />

                            <CustomNumericInput
                                label="Bottom"
                                prop="paddingBottom"
                                value={getValue('paddingBottom')}
                                className={getPropClass('paddingBottom')}
                                onTextConfigChange={this.props.onTextConfigChange}
                            />

                        </div>
                    </this.CustomizedControl>

                    <this.CustomizedControl property={['paddingLeft', 'paddingRight']}>
                        <div className="box-controls">
                            <CustomNumericInput
                                label="Left"
                                prop="paddingLeft"
                                value={getValue('paddingLeft')}
                                className={getPropClass('paddingLeft')}
                                onTextConfigChange={this.props.onTextConfigChange}
                            />
                            <CustomNumericInput
                                label="Right"
                                prop="paddingRight"
                                value={getValue('paddingRight')}
                                className={getPropClass('paddingRight')}
                                onTextConfigChange={this.props.onTextConfigChange}
                            />

                        </div>
                    </this.CustomizedControl>

                    <this.CustomizedControl property={['borderTop','borderBottom']}>
                        <Label>Border</Label>
                        <div className="box-controls">

                            <CustomNumericInput
                                label="Top"
                                prop="borderTop"
                                value={getValue('borderTop')}
                                className={getPropClass('borderTop')}
                                onTextConfigChange={this.props.onTextConfigChange}
                            />

                            <CustomNumericInput
                                label="Bottom"
                                prop="borderBottom"
                                value={getValue('borderBottom')}
                                className={getPropClass('borderBottom')}
                                onTextConfigChange={this.props.onTextConfigChange}
                            />

                        </div>
                    </this.CustomizedControl>

                    <this.CustomizedControl property={['borderLeft', 'borderRight']}>
                        <div className="box-controls">
                            <CustomNumericInput
                                label="Left"
                                prop="borderLeft"
                                value={getValue('borderLeft')}
                                className={getPropClass('borderLeft')}
                                onTextConfigChange={this.props.onTextConfigChange}
                            />
                            <CustomNumericInput
                                label="Right"
                                prop="borderRight"
                                value={getValue('borderRight')}
                                className={getPropClass('borderRight')}
                                onTextConfigChange={this.props.onTextConfigChange}
                            />

                        </div>
                    </this.CustomizedControl>

                    <this.CustomizedControl property={'borderColor'}>
                        <ColorPicker
                            disabled={readOnly}
                            className={getPropClass('borderColor')}
                            label={'Border Color'}
                            value={getValue('borderColor')}
                            handleColorChange={ color => this.props.onTextConfigChange({'borderColor': color}) }
                        />
                    </this.CustomizedControl>

                    <this.CustomizedControl property={'transform'}>
                        {
                            ButtonsGroup('Scale', [
                                {text: '100%', value: 'scale(1)'},
                                {text: '120%', value: 'scale(1.2)'},
                                {text: '150%', value: 'scale(1.5)'}], 'transform', getValue('transform'))
                        }
                    </this.CustomizedControl>

            </div>

            {
                !isStatic && <div>
                    {
                        !overrideConfig && ButtonsGroup('Word Scrolling', [
                                {value: 'wordbyword', text: 'Word by word'},
                                {value: 'highlight', text: 'Highlight'},
                                {value: 'none', text: 'No Animation'}
                            ], 'wordScrolling',
                            getValue('wordScrolling', 'wordbyword'))
                    }
                    {
                        getValue('wordScrolling', 'wordbyword') === 'wordbyword' &&
                        <div>
                            {
                                ButtonsGroup('Word Animation', [
                                        {value: 'opacity', text: 'opacity'},
                                        {value: 'scale', text: 'scale'},
                                        {value: 'up', text: 'slide from top'},
                                        {value: 'left', text: 'slide from left'},
                                        {value: 'right', text: 'slide from right'},
                                        {value: 'down', text: 'slide from bottom'}],
                                    'wordAnimation',
                                    getValue('wordAnimation', 'opacity'))
                            }

                            <FormGroup label={'Duration (seconds)'}>
                                <NumericInput
                                    onValueChange={(val, str) => this.props.onTextConfigChange({duration: str})}
                                    value={getValue('duration', 0.3)}
                                    min={0.1}
                                    max={10}
                                    stepSize={0.1}
                                />
                            </FormGroup>

                            {
                                ButtonsGroup('Effect', [
                                        {value: 'Sine', text: 'Sine'},
                                        {value: 'Expo', text: 'Expo'},
                                        {value: 'Power4', text: 'Power4'},
                                        {value: 'Back', text: 'Back'},
                                        {value: 'Bounce', text: 'Bounce'},
                                        {value: 'Elastic', text: 'Elastic'}],
                                    'wordEffect',
                                    getValue('wordEffect', 'Sine'))
                            }
                            {
                                ButtonsGroup('Easing', [
                                        {value: 'easeIn', text: 'Ease In'},
                                        {value: 'easeOut', text: 'Ease Out'}],
                                    'wordEasing',
                                    getValue('wordEasing', 'easeOut'))
                            }
                        </div>
                    }

                    {
                        getValue('wordScrolling') === 'highlight' &&
                        <div>
                            <ColorPicker
                                className={getPropClass('highlightColor')}
                                label={'Highlight'}
                                value={getValue('highlightColor')}
                                handleColorChange={ color => this.props.onTextConfigChange({'highlightColor': color}) }
                            />

                            {
                                ButtonsGroup('Reset Previous Word Color', [
                                        {value: true, text: 'Yes'},
                                        {value: false, text: 'No'}],
                                    'resetColor',
                                    getValue('resetColor'))
                            }

                        </div>
                    }
                </div>
            }
        </div>)
    }

}

export default TextControls;