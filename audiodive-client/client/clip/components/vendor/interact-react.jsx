import React, { Component, cloneElement } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types';

import interact from 'interact.js'

export default class Interactable extends Component {

    static defaultProps = {
        draggable: false,
        resizable: false,
        draggableOptions: {},
        resizableOptions: {}
    }

    render() {
        return cloneElement(this.props.children, {
            ref: node => this.node = node,
            draggable: false
        })
    }

    componentDidMount() {
        this.interact = interact(findDOMNode(this.node))
        this.setInteractions()
    }

    componentWillReceiveProps() {
        this.interact = interact(findDOMNode(this.node))
        this.setInteractions()
    }

    setInteractions() {

        const draggableOpt = this.props.draggableOptions
        if (this.props.snap) {
            const gridTarget = interact.createSnapGrid({
                x: 10,
                y: 10,
                range: 10
            });

            draggableOpt.snap = { targets: [gridTarget] }
        }

        if (this.props.draggable) this.interact.draggable(draggableOpt)
        if (this.props.resizable) this.interact.resizable(this.props.resizableOptions)
    }
}

Interactable.propTypes = {
    children: PropTypes.node.isRequired,
    draggable: PropTypes.bool,
    draggableOptions: PropTypes.object,
    resizable: PropTypes.bool,
    resizableOptions: PropTypes.object
}