import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
    InputGroup, Intent
} from "@blueprintjs/core"
import debounce from "lodash/debounce"

class TimeInput extends Component {

    constructor() {
        super()

        this.state = {
            viewValue: '00:00:00',
            originalValue: 0
        }
    }

    componentDidMount() {

        if (this.props.value) {
            this.setState({
                viewValue: TimeInput.getPlaybackTime(this.props.value),
                originalValue: this.props.value
            })
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.value !== this.state.originalValue) {
            this.setState({
                viewValue: TimeInput.getPlaybackTime(this.props.value),
                originalValue: this.props.value
            })
        }
    }


    static getDeriveStateFromProps(newProps, oldState) {

        if (newProps.value !== oldState.originalValue) {
            return {
                viewValue: TimeInput.getPlaybackTime(newProps.value),
                originalValue: newProps.value
            }
        }

        return null
    }

    static getPlaybackTime(sec, precision = 1) {
        let {hours, minutes, seconds} = TimeInput.parseSeconds(sec)
        if (!precision) {
            seconds = Math.round(seconds)
        }

        if (hours   < 10) {hours   = "0" + hours}
        if (minutes < 10) {minutes = "0" + minutes}
        if (seconds < 10) {seconds = "0" + precision?seconds.toFixed(precision):seconds}
        return `${hours}:${minutes}:${seconds}`
    }

    static parseSeconds(input) {
        const sec_num = parseFloat(input)
        const hours   = Math.floor(sec_num / 3600)
        const minutes = Math.floor((sec_num - (hours * 3600)) / 60)
        const seconds = parseFloat((sec_num - (hours * 3600) - (minutes * 60)).toFixed(2))

        return {hours, minutes, seconds}
    }

    onChange(e) {
        this.setState({
            viewValue: e.target.value
        })
    }

    confirm() {
        this.props.onChange(this.getSecondsFromTime(this.state.viewValue))
    }

    getSecondsFromTime(timeString) {
        const timeSplit = timeString.split(':').map(n => Number.parseFloat(n || 0))
        const isValid = timeSplit.reduce((prev, current) => {
            const isNumber = !Number.isNaN(current)
            return prev && isNumber
        }, true)

        if (!isValid) {
            return null
        }

        switch(timeSplit.length) {
            case 1:
                return timeSplit[0]
            case 2:
                return (timeSplit[0] * 60) + timeSplit[1]
            case 3:
                return (timeSplit[0] * 3600) + (timeSplit[1] * 60) + timeSplit[2]
        }
    }


    render() {

        const {intent, className, id, leftIcon, placeholder, rightElement, readOnly} = this.props
        const inputIntent = this.getSecondsFromTime(this.state.viewValue) === null?Intent.DANGER:intent


        return (
            <InputGroup
                onKeyPress={e => e.which === 13 && this.confirm()}
                onBlur={this.confirm.bind(this)}
                intent={inputIntent}
                className={className + ' time-input'}
                id={id}
                leftIcon={leftIcon}
                placeholder={placeholder}
                onChange={this.onChange.bind(this)}
                value={this.state.viewValue}
                rightElement={rightElement}
                readOnly={readOnly}
            />
        )
    }
}

TimeInput.propTypes = {}

export default TimeInput
