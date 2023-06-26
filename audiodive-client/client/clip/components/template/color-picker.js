import {ChromePicker} from 'react-color'
import React from 'react'
import {Button, Popover, Position, FormGroup, InputGroup, ControlGroup} from "@blueprintjs/core"


class ColorPicker extends React.Component {

    constructor() {
        super()

        this.state = {
            open: false
        }
    }

    toggleColorPicker(){

        this.setState({
            open: !this.state.open
        })
    }

    handleColorChange(color) {

        if (this.props.type === 'hsl') {
            this.props.handleColorChange({
                h: Math.round(color.hsl.h),
                s: Math.round(color.hsl.s * 100),
                l: Math.round(color.hsl.l * 100)
            })
        }
        else if (color.source === 'rgb') {
            this.props.handleColorChange(`rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`)
        }
        else {
            this.props.handleColorChange(color.hex)
        }

    }

    render() {

        const {disabled} = this.props

        const getCSSColor = (c) => {
            if (this.props.type === 'hsl') {
                return `hsl(${c.h},${c.s}%,${c.l}%)`
            }

            return c
        }

        const getTextColor = (c) => {

            if (this.props.type === 'hsl') {
                return `${c.h} ${c.s}% ${c.l}%)`
            }

            return c || 'none'
        }

        return (
            <FormGroup fill={true} disabled={disabled} label={this.props.label} className={this.props.className}>


                <ControlGroup fill={true} vertical={false}>

                    {
                        !this.props.hideInput &&
                        <InputGroup
                            disabled={disabled}
                            readOnly={this.props.type === 'hsl'}
                            className="color-input push-right"
                            value={getTextColor(this.props.value)}
                            onChange={(e) => this.props.handleColorChange(e.target.value)} />
                    }

                    <Popover
                        disabled={disabled}
                        minimal={true}
                        position={Position.BOTTOM_LEFT}
                        usePortal={true}
                        content={<ChromePicker
                            color={ this.props.value }
                            minimal={true}
                            onChangeComplete={this.handleColorChange.bind(this)}
                        />}>
                        <Button style={{
                            backgroundColor: getCSSColor(this.props.value) || 'none',
                            backgroundImage: 'none'
                        }} />
                    </Popover>

                    <Button icon={'cross'} onClick={_ => this.props.handleColorChange(null)} />
                </ControlGroup>


            </FormGroup>
        )
    }
}

ColorPicker.defaultProps = {
    type: 'hex',
    className: ''
}

export default ColorPicker;