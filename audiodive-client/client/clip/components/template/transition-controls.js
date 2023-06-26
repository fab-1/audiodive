import React from 'react'
import {
    RadioGroup,
    Radio,
    Button,
    ButtonGroup,
    Classes,
    Label,
    Intent,
    Menu,
    MenuItem,
    NumericInput,
    Popover,
    Position,
    TextArea,
    FormGroup,
    Slider,
    Tree,
    H5
} from "@blueprintjs/core"

//todo : rename easing to effect
export default class TransitionControls extends React.Component {

    render() {

        const {transition, config, isTemplateElement, showTextProperty} = this.props

        const direction = transition === 'showTransition'? 'From':'To'
        const scale = transition === 'showTransition'? 'In':'Out'
        const timeOffset = transition === 'showTransition'? 'Delay':'Lead'

        const getValue = (prop, defaultVal = 0) => {

            // if (!this.props.config[prop]) {
            //     return null
            // }

            return config && config[prop] || defaultVal
        }

        const ButtonsGroup = (name = '', options, property, value) => {

            const buttons = options.map(option => {
                return (<Button
                    active={option.value === value}
                    key={option.value}
                    onClick={e => this.props.onChange({[property]: option.value})}>
                    {option.label || option.text || option.value}
                </Button>)
            })

            return (<FormGroup label={name}>
                <ButtonGroup className='bp3-small'>{buttons}</ButtonGroup>
            </FormGroup>)
        }


        let properties = [
            {label: `None`, value: 'none'},
            {label: `Zoom ${scale}`, value: 'scale'},
        ]

        if (transition !== 'during') {
            properties = properties.concat([{label: `Opacity`, value: 'opacity'},
                {label: `${direction} Left`, value: 'left'},
                {label: `${direction} Right`, value: 'right'},
                {label: `${direction} Top`, value: 'up'},
                {label: `${direction} Bottom`, value: 'down'},])
        }

        // if (showTextProperty) {
        //     properties.push({label: `Text Animation`, value: 'text'})
        // }

        return <section>

            <Button
                className='margin-bottom'
                fill={true}
                icon={'play'}
                onClick={_ => this.props.previewAnim()}
                text={'Test Transition'}
                small={true}
            />

            {
                transition !== 'during' &&
                <FormGroup label={'Duration (seconds)'}>
                    <NumericInput
                        onValueChange={(val, str) => this.props.onChange({duration: str})}
                        value={getValue('duration', 0.3)}
                        min={0.1}
                        max={10}
                        stepSize={0.1}
                    />
                </FormGroup>
            }

            {
                transition === 'showTransition' && <div>
                    <RadioGroup
                        className={'margin-bottom'}
                        label="Show Element at"
                        onChange={e => this.props.onChange({showEvent: e.target.value})}
                        selectedValue={getValue('showEvent', 'afterDelay')}>
                        <div className='box-controls'>
                            <FormGroup>
                                <NumericInput
                                    className={'bp3-fill'}
                                    onValueChange={(val, str) => this.props.onChange({delay: str})}
                                    value={getValue('delay', '')}
                                    max={10}
                                    stepSize={0.1}
                                />
                            </FormGroup>
                            <Label>Seconds</Label>
                        </div>

                        <Radio label="After showing the template" value="afterDelay" />
                        <Radio label="Before hiding the template" value="beforeEnd" />
                    </RadioGroup>
                </div>
            }

            {
                transition === 'hideTransition' && <div>
                    {
                        isTemplateElement &&
                        <RadioGroup
                            className={'margin-bottom'}
                            label="Hide Element at"
                            onChange={e => this.props.onChange({hideEvent: e.target.value})}
                            selectedValue={getValue('hideEvent', 'beforeEnd')}>
                            <div className='box-controls'>
                                <FormGroup>
                                    <NumericInput
                                        className={'bp3-fill'}
                                        onValueChange={(val, str) => this.props.onChange({offset: str})}
                                        value={getValue('offset', '')}
                                        max={10}
                                        stepSize={0.2}
                                    />
                                </FormGroup>
                                <Label>Seconds</Label>
                            </div>

                            <Radio label="Before hiding the template" value="beforeEnd" />
                            <Radio label="After showing the template" value="afterDelay" />
                        </RadioGroup>
                    }
                </div>
            }

            {
                showTextProperty &&
                ButtonsGroup(
                    'Nice Text Animation',
                    [{value:null, text:'No'}, {value: true, text: 'Yes'}],
                    'textAnim',
                    getValue('textAnim')
                )
            }


            {
                ButtonsGroup(
                    'Animation Property',
                    properties,
                    'cssProperty',
                    getValue('cssProperty')
                )
            }


            {
                getValue('cssProperty') === 'scale' &&
                <div>

                    <div className="box-controls">
                        <FormGroup label={'Origin X'}>
                            <NumericInput
                                className={Classes.FILL}
                                onValueChange={val => this.props.onChange({originX: val})}
                                value={getValue('originX')}
                            />
                        </FormGroup>

                        <FormGroup label={'Origin Y'}>
                            <NumericInput
                                className={Classes.FILL}
                                onValueChange={val => this.props.onChange({originY: val})}
                                value={getValue('originY')}
                            />
                        </FormGroup>

                        <FormGroup className='margin-left-5' label={''}>
                            <Button small={true} active={this.props.scaleActive} icon='select' onClick={this.props.selectScaleOrigin} />
                        </FormGroup>
                    </div>

                    <FormGroup label={'Zoom'}>
                        <Slider
                            className={'margin-bottom-10'}
                            min={1}
                            max={4}
                            stepSize={0.2}
                            onChange={val => this.props.onChange({scale: val})}
                            labelRenderer={false}
                            value={getValue('scale', 1)}
                        />
                    </FormGroup>
                </div>
            }

            {
                getValue('cssProperty') !== 'none' && <div>
                    {
                        ButtonsGroup(
                            'Motion Style',
                            [
                                {value: 'Linear', text: 'Linear'},
                                {value: 'Sine', text: 'Sine'},
                                {value: 'Expo', text: 'Expo'},
                                {value: 'Power4', text: 'Power4'},
                                {value: 'Back', text: 'Back'},
                                {value: 'SlowMo', text: 'Slow Motion'},
                                {value: 'Bounce', text: 'Bounce'},
                                {value: 'Elastic', text: 'Elastic'}
                            ],
                            'easing',
                            getValue('easing'))
                    }
                    {
                        ButtonsGroup(
                            'Acceleration',
                            [
                                {value: 'easeIn', text: 'Ease In'},
                                {value: 'easeOut', text: 'Ease Out'},
                                {value: 'easeInOut', text: 'Ease In and Ease Out'}
                            ],
                            'acceleration',
                            getValue('acceleration'))
                    }
                </div>
            }


        </section>
    }

}