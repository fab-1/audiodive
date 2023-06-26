import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Classes, NumericInput, Button, FormGroup, Tooltip} from "@blueprintjs/core"
import debounce from "lodash/debounce"
import UI_TEXT from './../../clip/ui-text'

class BoxControls extends Component {

    constructor() {
        super()
        this.state = {
            lock: true,
            currentId: null
        }
    }

    componentDidMount() {
        const {selectedObject} = this.props
        if (selectedObject && selectedObject.id === 'textArea') {
            this.setState({lock: false})
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {


        const {selectedObject} = nextProps

        if (prevState.currentId !== selectedObject.id) {
            return {selectedObject: selectedObject.id}
        }

        return null
    }

    toggleLock() {
        this.setState({lock: !this.state.lock})
    }

    render() {

        const {selectedObject} = this.props
        this.debouncedObjectUpdate = debounce(this.props.updateBox, 10)
        this.debouncedObjectScale = debounce(this.props.scaleObject, 10)

        const left = Math.round(selectedObject.left)
        const top = Math.round(selectedObject.top)

        const width = Math.round(selectedObject.width * selectedObject.scaleX)
        const height = Math.round(selectedObject.height * selectedObject.scaleY)

        return (
            <div>
                <section className="box-controls">
                    <FormGroup label={'Left'}>
                        <NumericInput
                            className={Classes.FILL}
                            onValueChange={val => this.debouncedObjectUpdate(selectedObject.id, 'left' , val)}
                            value={left}
                        />
                    </FormGroup>

                    <FormGroup label={'Top'}>
                        <NumericInput
                            className={Classes.FILL}
                            onValueChange={val => this.debouncedObjectUpdate(selectedObject.id, 'top' , val)}
                            value={top}
                        />
                    </FormGroup>
                </section>

                <section className="box-controls">
                    <FormGroup label={'Width'}>
                        <NumericInput
                            className={Classes.FILL}
                            onValueChange={this.debouncedObjectScale.bind(this, selectedObject.id, 'scaleX')}
                            placeholder={0}
                            value={width || ''}
                        />
                    </FormGroup>
                    <FormGroup label={'Height'}>
                        <NumericInput
                            className={Classes.FILL}
                            placeholder={0}
                            onValueChange={this.debouncedObjectScale.bind(this, selectedObject.id, 'scaleY')}
                            value={height || ''}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Tooltip content={UI_TEXT.LOCK_P}>
                            <Button
                                className='lock-button' icon='lock'
                                active={selectedObject.lockUniScaling}
                                small={true}
                                onClick={e => this.props.updateBox(selectedObject.id, 'lockUniScaling' , !selectedObject.lockUniScaling)} />
                        </Tooltip>
                    </FormGroup>
                </section>

                <FormGroup label={'Rotation'} inline={true}>
                    <NumericInput
                        onValueChange={this.debouncedObjectUpdate.bind(this, selectedObject.id, 'angle')}
                        value={Math.round(selectedObject.angle)}
                    />
                </FormGroup>
            </div>
        )
    }
}

BoxControls.propTypes = {}

export default BoxControls
