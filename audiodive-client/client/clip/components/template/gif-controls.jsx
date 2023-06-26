import React from 'react'
import {FormGroup, Button, ButtonGroup, Collapse, Intent, NumericInput, Switch, Tab, Tabs} from "@blueprintjs/core"
import TimeInput from "../../../shared/controls/time-input.jsx"


export default class GifControls extends React.Component{

    constructor() {
        super();

        this.state = {}
    }

    componentDidMount() {

    }

    render() {

        const MediaPropertyControl = (name, options, property, selected) => {

            const valueChange = value => this.props.onChange({[property]: value})

            return (<FormGroup label={name}>
                <ButtonGroup small={true}>
                    {
                        options.map(propValue => {
                            const label = (typeof propValue === 'string' ? propValue : propValue.label);
                            const value = (typeof propValue === 'string' ? propValue : propValue.value);
                            const className = selected[property] === value ? 'bp3-active' : '';

                            return (<Button
                                small={true}
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

        return <div className="margin-top-10">

            <Switch
                label="Loop Animation"
                checked={!!this.props.config.loop}
                onChange={e => this.props.onChange({'loop': e.target.checked})}
            />

            <Switch
                label="Ping Pong"
                checked={!!this.props.config.pingPong}
                onChange={e => this.props.onChange({'pingPong': e.target.checked})}
            />

            <FormGroup label={'Stop Time'}>
                <TimeInput
                    precision={1}
                    type="number"
                    onChange={seconds => this.props.onChange({'end': seconds})}
                    value={this.props.config.end || 0}
                    leftIcon={'time'} />
            </FormGroup>

            {
                MediaPropertyControl(
                    'Speed',
                    [{
                        label: 'Super Slow',
                        value: 10
                    },{
                        label: 'Very Slow',
                        value: 8
                    },
                    {
                        label: 'Slow',
                        value: 6
                    },
                    {
                        label: 'Default',
                        value: 4
                    },
                    {
                        label: 'Fast',
                        value: 2
                    }],
                    'speed',
                    this.props.config
                )
            }
        </div>
    }

}


