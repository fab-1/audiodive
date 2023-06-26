import React from 'react'
import ColorPicker from './color-picker.js'
import {FormGroup, Classes, Button, ButtonGroup, NumericInput, Slider, Tab, Tabs} from "@blueprintjs/core"
import Panel from "../clip-editor/panel.jsx"
import JSONInput from 'react-json-editor-ajrm';
import locale    from 'react-json-editor-ajrm/locale/en';

export default class ParticlesControls extends React.Component {

    constructor() {
        super();

        this.state = {}
    }

    componentDidMount() {

    }

    onParticleConfigChange = ({jsObject}) => {
        if (jsObject) {
            this.props.onConfigChange({'config': jsObject})
        }
    }

    render() {

        const {area, onConfigChange} = this.props

        const getValue = (prop) => {
            return this.props.textConfig[prop];
        }

        const ButtonsGroup = (name = '', options, property) => {

            const value = visArea[property]

            return (<FormGroup label={name}>
                <ButtonGroup>
                    {
                        options.map(option => <Button
                            active={option.value == value}
                            key={option.value}
                            onClick={e => onConfigChange({[property]: option.value})}>
                            {option.text || option.value}
                        </Button>)
                    }
                </ButtonGroup>
            </FormGroup>)
        }

        const variationControl = (label, key, subkey, max = 50, step = 1) => {

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
                    value={value}
                />
            </FormGroup>
        }

        return <div>

            {/*<ColorPicker*/}
                {/*type={'hsl'}*/}
                {/*label={'Color'}*/}
                {/*value={visArea.hslColor}*/}
                {/*handleColorChange={c => onConfigChange({'hslColor': c})}*/}
            {/*/>*/}

            <JSONInput
                id={'json'}
                locale      = { locale }
                height      = {'550px'}
                width      = {'230px'}
                placeholder={area.config}
                onChange={this.onParticleConfigChange}
                waitAfterKeyPress={4000}
            />
        </div>
    }
}