import React from 'react'
import * as d3 from 'd3'
import frequencyToIndex from 'audio-frequency-to-index'
import clamp from 'clamp'
import {Utils} from '../../../shared/utils'

import SAMPLE_DATA from './sample-data'


export default class ParticlesPreview extends React.Component {

    constructor() {
        super()
    }

    componentDidMount() {
        document.addEventListener('fftDataUpdate', this.dataUpdated)
        this.init()
    }

    init() {
        const {area, id, isPreview} = this.props
        tsParticles.load(id, area.config).then(container => {
            window.particleContainer = this.particleContainer = container
            if (isPreview) {
                setTimeout(_ => this.particleContainer.pause(), 10)
            }
        });


    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (!this.props.isPreview) {
            return true
        }
        else if (this.props.currentFrame !== nextProps.currentFrame) {

            return false
        }

        return true
    }

    dataUpdated = data => {
        
    }

    componentWillUnmount() {
        document.removeEventListener('fftDataUpdate', this.dataUpdated)
    }

    componentDidUpdate(prevProps, prevState) {
        //this.initVis()

        if (prevProps.originalElement !== this.props.originalElement) {
            this.particleContainer.destroy()
            this.init()
        }
    }

    getRange(color, variation, max = 100) {
        return [
            Math.max(0, color - variation),
            Math.min(max, color + variation)
        ]
    }

    updateVis(data) {
        const {width, height, sampleSize, gap, hAlign, vAlign} = this.props.visArea

        const sel = d3.select(".frequency");
        const aggregatedData = data.slice(0, sampleSize);

        sel.selectAll("rect.frequency-bar")
            .data(aggregatedData)
    }

    render() {

        const {area} = this.props
        const areaStyle = Utils.getStyles(area)

        return (<div id={this.props.id} className="layout-editor-dynamic-view-mode" style={areaStyle}>

        </div>)
    }
}