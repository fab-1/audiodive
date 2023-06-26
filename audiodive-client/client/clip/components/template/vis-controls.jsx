import React from 'react'
import * as d3 from 'd3'
import ColorPicker from './color-picker.js'
import {FormGroup, Classes, Button, ButtonGroup, NumericInput, Slider, RangeSlider, HTMLSelect } from "@blueprintjs/core"
import Panel from "../clip-editor/panel.jsx"
const INTERPOLATORS = ['interpolateSpectral', 'interpolateBuGn', 'interpolateBuPu', 'interpolateGnBu', 'interpolateOrRd', 'interpolatePuBuGn',
    'interpolatePuBu', 'interpolatePuRd', 'interpolateRdPu', 'interpolateYlGnBu', 'interpolateYlGn', 'interpolateYlOrBr', 'interpolateYlOrRd', 'interpolateBlues',
    'interpolateGreens', 'interpolateGreys', 'interpolatePurples', 'interpolateReds', 'interpolateOranges', 'interpolateCividis', 'interpolateCubehelixDefault',
    'interpolateRainbow', 'interpolateWarm', 'interpolateCool', 'interpolateSinebow', 'interpolateTurbo', 'interpolateViridis', 'interpolateMagma',
    'interpolateInferno', 'interpolatePlasma']



export default class VisControls extends React.Component {

    constructor() {
        super();

        this.state = {}
    }

    componentDidMount() {
        document.addEventListener('keyup', this.onKeyChange)
    }

    componentWillUnmount() {
        document.removeEventListener('keyup', this.onKeyChange)
    }

    onKeyChange(e) {
        console.log(e)
    }

    render() {

        const {visArea, onConfigChange} = this.props

        if (!visArea.color && visArea.color !== null) {
            const hsl = `hsl(${visArea.hslColor.h}, ${visArea.hslColor.s}%, ${visArea.hslColor.l}%)`
            visArea.color = d3.color(hsl);
        }

        const getValue = (prop) => {
            return this.props.textConfig[prop];
        }

        const ButtonsGroup = (name = '', options, property, defaultValue) => {

            const value = visArea[property]

            return (<FormGroup label={name}>
                <ButtonGroup>
                    {
                        options.map(option => <Button
                            active={option.value === (value || defaultValue)}
                            key={option.value}
                            onClick={e => onConfigChange({[property]: option.value})}>
                            {option.text || option.value}
                        </Button>)
                    }
                </ButtonGroup>
            </FormGroup>)
        }

        const variationControl = (label, key, subkey, max = 50, step = 1, initialValue) => {

            const onChange = val => {
                if (subkey)
                    onConfigChange({[key]: {[subkey]: val}})
                else
                    onConfigChange({[key]: val})
            }

            const value = subkey?visArea[key][subkey]:visArea[key]

            return <FormGroup label={label}>
                <Slider
                    min={0}
                    max={max}
                    stepSize={step}
                    onChange={onChange}
                    labelRenderer={false}
                    value={value || initialValue}
                />
            </FormGroup>
        }

        return <div onKeyUp={e => console.log(e.target)}  >

            {
                ButtonsGroup('Type', [
                    {value: 'Flat'},
                    {value: 'Circular'}], 'visType', 'Flat')
            }

            <ColorPicker
                label={'Color'}
                value={visArea.color || ''}
                handleColorChange={c => onConfigChange({'color': c})}
            />

            <ColorPicker
                label={'Color 2 (select Gradient below)'}
                value={visArea.gradientColor1 || ''}
                handleColorChange={c => onConfigChange({'gradientColor1': c})}
            />

            <FormGroup label={`Color Scale`}>
                <HTMLSelect value={visArea.colorScale} onChange={event => onConfigChange({'colorScale': event.target.value})}>
                    <option value={''}>None</option>
                    <option value={'interpolateRgb'}>Gradient</option>
                    {
                        INTERPOLATORS.map(name =>  <option value={name}>
                            {name.replace('interpolate', '')}
                        </option>)
                    }
                </HTMLSelect>
            </FormGroup>

            <FormGroup label={`Frequency Range`}>
                <RangeSlider
                    min={0}
                    max={100}
                    stepSize={1}
                    labelStepSize={20}
                    onChange={val => onConfigChange({'freqRange': val})}
                    value={visArea.freqRange || [6, 90]}
                />
            </FormGroup>


            <FormGroup label={`Number Of Bars`}>
                <NumericInput
                    onValueChange={val => onConfigChange({'sampleSize': val})}
                    value={visArea.sampleSize}
                    min={10}
                    max={256}
                />
            </FormGroup>

            <FormGroup label={`Stroke Width`}>
                <NumericInput
                    onValueChange={val => onConfigChange({'strokeWidth': val})}
                    value={visArea.strokeWidth}
                    min={0}
                    max={5}
                />
            </FormGroup>

            {
                !!visArea.strokeWidth && visArea.strokeWidth !== 0 &&
                <ColorPicker
                    label={'Stroke Color'}
                    value={visArea.strokeColor}
                    handleColorChange={c => onConfigChange({'strokeColor': c})}
                />
            }

            {
                variationControl('Bars padding', 'padding', false, 1, 0.1, 0.5)
            }

            {
                visArea.visType !== 'Circular' &&
                <div>

                    {
                        ButtonsGroup('Y Align', [
                            {value: 'bottom'},
                            {value: 'center'}], 'vAlign')
                    }

                    {
                        ButtonsGroup('X Align', [
                            {value: 'left'},
                            {value: 'right'},
                            {value: 'center'}], 'hAlign')
                    }

                </div>
            }



            {
                visArea.visType === 'Circular' &&
                <div>

                    <FormGroup label={`Inner Radius`}>
                        <NumericInput
                            onValueChange={val => onConfigChange({'innerRadius': val})}
                            value={visArea.innerRadius || 80}
                            min={20}
                            max={400}
                        />
                    </FormGroup>

                </div>
            }



        </div>
    }
}