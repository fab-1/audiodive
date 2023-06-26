import {Intent, H6, Button, Collapse, ButtonGroup,  Alignment} from '@blueprintjs/core'

import React, {Component} from 'react';
import PropTypes from 'prop-types';


class Accordion extends Component {

    constructor(){
        super()
        this.state = {
            isOpen: false,
            selected: {0:true},
            current: null
        }
    }

    componentDidMount() {


        const {sections} = this.props
        window.addEventListener('resize', this.setWindowHeight.bind(this))
        this.setWindowHeight()

        // const selected = {}
        // // sections.forEach((section, index) => {
        // //     selected[index] = section.isDefault
        // // })
        //
        // selected[0] = true
        //
        // this.setState({selected})
    }

    toggleCollapse(current) {

        const selected = {
            [current]: true
        }

        this.setState({selected})
    }

    setWindowHeight() {
        this.setState({windowHeight: window.innerHeight})
    }

    render() {

        const {sections} = this.props
        let {selected, windowHeight} = this.state
        const panelHeight = windowHeight - 42 - (sections.length * 36)


        return <div>

            <ButtonGroup fill={true} className={'accordion-buttons'} >
                {
                    sections.map((section, index) => <Button
                        small={true}
                        key={section.text}
                        active={selected[index]}
                        //rightIcon={selected[index]?'chevron-down':'chevron-right'}
                        //className='accordion-toggle'
                        minimal={true}
                        intent={section.intent || Intent.PRIMARY}
                        text={section.text}
                        icon={section.icon}
                        onClick={this.toggleCollapse.bind(this, index)}
                    />)
                }
            </ButtonGroup>
            {
                sections.map((section, index) => <div key={section.text} className='accordion'>

                    {
                        selected[index] &&
                        <div className='accordion-content'>{section.content}</div>
                    }

                </div>)
            }
        </div>
    }
}

Accordion.propTypes = {};

export default Accordion;