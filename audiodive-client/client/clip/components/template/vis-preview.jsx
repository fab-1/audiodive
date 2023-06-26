import React from 'react'
import * as d3 from 'd3'
import frequencyToIndex from 'audio-frequency-to-index'
import clamp from 'clamp'
import {Utils} from '../../../shared/utils'

import SAMPLE_DATA from './sample-data'


export default class VisPreview extends React.Component {

    constructor() {
        super()
    }

    componentDidMount() {
        document.addEventListener('fftDataUpdate', this.dataUpdated)

        this.initVis()
    }

    dataUpdated = data => {
        this.lastData = data.detail
        this.refreshVis(data.detail)
    }

    componentWillUnmount() {
        document.removeEventListener('fftDataUpdate', this.dataUpdated)
    }

    componentDidUpdate(prevProps, prevState) {
        //this.initVis()
        if (prevProps.audioData !== this.props.audioData) {
            this.refreshVis(this.props.audioData)
        }

        if (prevProps.originalElement !== this.props.originalElement) {
            this.initVis()
        }

        const {visArea} = this.props
        const prevVisArea = prevProps.visArea
        if (visArea.width !== prevVisArea.width || visArea.height !== prevVisArea.height) {
            this.initVis()
        }

    }

    getRange(color, variation, max = 100) {
        return [
            Math.max(0, color - variation),
            Math.min(max, color + variation)
        ]
    }

    initVis() {
        const {visType} = this.props.visArea

        if (visType === 'Circular') {
            this.initCircularVis2()
        }
        else {
            this.initFlatVis()
        }

        if (!this.props.noStartData) {
            this.refreshVis(this.lastData || SAMPLE_DATA)
            this.refreshVis(this.lastData || SAMPLE_DATA)
        }

        //console.log('init vis', this.props.isMusic)
    }

    initColorScales() {
        let {hslColor, gradientColor1, colorScale, color } = this.props.visArea

        if (!color) {
            const hsl = `hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)`
            color = d3.color(hsl);
        }

        if (colorScale) {

            let interpolate = d3[colorScale]
            if (colorScale === 'interpolateRgb') {
                interpolate = d3.interpolateRgb(color, gradientColor1)
            }

            this.colorScale = d3.scaleSequential()
                .domain([0, 240])
                .interpolator(interpolate);
        }

    }

    initFlatVis(){

        const {width, height, sampleSize, padding } = this.props.visArea
        this.xScale = d3.scaleLinear()
            .range([0, width])
            .domain([0, sampleSize])

        const innerPadding = padding || 0.5

        this.bandScale = d3.scaleBand()
            .domain([...Array(sampleSize)].map((u, i) => i))
            .range([0, width])
            .paddingInner(innerPadding)
            .paddingOuter(innerPadding/4);


        this.yScale = d3.scaleLinear()
            .clamp(true)
            .domain([0, 240])
            .range([0, height])


        const freq = d3.select(".frequency");

        // Remove any rects already in the selector
        freq.selectAll("rect").remove();

        // Add a transparent rect so scaleY scales the appropriate height
        freq.append("rect")
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'background')


        this.initColorScales()
    }

    initCircularVis2() {

        let {width, height, sampleSize, padding, innerRadius = 80} = this.props.visArea
        let outerRadius = Math.min(width, height) / 2;

        const innerPadding = padding || 0.5

        this.xScale = d3.scaleBand()
            .range([0, 2 * Math.PI])
            .paddingInner(innerPadding)
            .paddingOuter(innerPadding/4)
            .align(0)
            .domain([...Array(sampleSize)].map((u, i) => i))

        // Y scale
        this.yScale = d3.scaleRadial()
            .range([innerRadius, outerRadius])
            .domain([0, 230])

        const freq = d3.select("#radial");

        // Remove any rects already in the selector
        freq.selectAll("g").remove();

        const svg = freq.append("g")
            .attr('class', 'radial')
            .attr("transform", "translate(" + width / 2 + "," + ( height/2 )+ ")")

        this.initColorScales()
    }


    reduceArray(d) {
        return d.reduce(function(a, x) {
            return a + x;
        }, 0) / d.length;
    }

    frequencyToIndex (frequency, sampleRate, frequencyBinCount) {
        var index = Math.round(frequency / sampleRate * frequencyBinCount)
        return clamp(index, 0, frequencyBinCount)
    }

    analyserFrequencyAverage (sampleSize, frequencies, minHz, maxHz) {
        const {isMusic} = this.props
        const sampleRate = isMusic ? 44100:22050
        //we filter out these frequencies under 150Hz
        minHz = Math.max(minHz, 150)

        let binCount = frequencies.length //Math.min(frequencies.length, isMusic? 300:150) //we filter out all the high frequencies bins because the are usually empty (returns 0)
        let start = this.frequencyToIndex(minHz, sampleRate, binCount)
        // //we skip the first one
        // if (start === 0) {
        //     start = 1
        // }

        let end = this.frequencyToIndex(maxHz, sampleRate, binCount)
        //console.log(minHz, start)
        //console.log(maxHz, end)
        let count = end - start
        let sum = 0
        for (; start < end; start++) {
            sum += frequencies[start]
        }
        return count === 0 ? 0 : (sum / count)
    }

    refreshVis(data) {

        const {visType, freqRange} = this.props.visArea

        const frequencyRange = freqRange || [6,90]
        this.frequencyRangeScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, data.length])

        const lowIndex = this.frequencyRangeScale(frequencyRange[0])
        const highIndex = this.frequencyRangeScale(frequencyRange[1])

        data = data.slice(lowIndex, highIndex)

        if (visType === 'Circular') {
            this.refreshRadial(data)
        }
        else {
            this.refreshFlat(data)
        }

    }

    refreshFlat(data) {


        let {width, height, sampleSize, strokeColor, strokeWidth, freqRange,
            hAlign, vAlign, borderRadius, colorScale, color, hslColor} = this.props.visArea
        //let {sampleSize, gap, hAlign, vAlign} = this.props.originalElement
        //const {borderRadius} = this.props.originalElement




        const sel = d3.select(".frequency");

        const sampleRate = this.props.isMusic? 44100:22050
        const sample = Math.round(sampleRate / sampleSize)
        const newData = new Array(sampleSize)
        for (let i = 0; i < sampleSize; i++) {
            const index = i
            newData[i] = this.analyserFrequencyAverage(sampleSize, data, index * sample, (index+1) * sample )
        }

        if (!color && hslColor) {
            const hsl = `hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)`
            color = d3.color(hsl);
        }

        //console.log(newData)

        // Set the transform to force the scaleY
        sel.attr("style", "transform-origin: " + (width / 2) + "px " + (height / 2) + "px; transform: scaleY(-1);")

        //update
        const rect = sel.selectAll("rect.frequency-bar")
            .data(newData)
            .attr("height", d =>  {
                if (d === undefined) d = 0
                return Math.max(0, this.yScale(d))
            })
            .attr("fill", v => {
                v = v || 0
                if (colorScale) {
                    return this.colorScale(v)
                }
                return color
            })
            .attr("stroke", (d) => {
                return strokeColor || 'none'
            })
            .attr("strokeWidth", (d) => {
                return strokeWidth || 0
            })
            .attr("y", d => {
                d = d || 0
                const value = Math.max(0, this.yScale(d))
                if (vAlign === 'center') {
                    return (height - value) / 2
                }
                return 0
            })

        //enter
        rect.enter()
            .append("rect")
            .attr("class", "frequency-bar")
            .attr("x", (d, i) => {
                let x = i
                if (hAlign === 'center') {
                    const middle = Math.round(sampleSize/2)
                    const step = Math.round(i/2)
                    x = (i%2 === 0? middle + step: middle - step)
                }
                if (hAlign === 'right') {
                    x = sampleSize - x
                }

                return this.bandScale(x)
            })
            .attr("width", () => {
                return this.bandScale.bandwidth()
            })
            .attr('rx', () => borderRadius || 0)

        //exit
        rect.exit().remove();

    }

    refreshRadial(data) {

        let {width, height, sampleSize, gap, hAlign, innerRadius = 80, hslColor, colorScale, strokeWidth, strokeColor, color} = this.props.visArea

        const sampleRate = this.props.isMusic? 44100:22050
        const sample = Math.round(sampleRate / sampleSize)
        const newData = new Array(sampleSize)
        for (let i = 0; i < sampleSize; i++) {
            const index = i
            newData[i] = this.analyserFrequencyAverage(sampleSize, data, index * sample, (index+1) * sample )
        }

        if (!color && hslColor) {
            const hsl = `hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)`
            color = d3.color(hsl);
        }

        const sel = d3.select(".radial");

        //update
        const rect = sel.selectAll(".frequency-bar")
            .data(newData)
            .attr("fill", (v) => {

                v = v || 0

                if (colorScale) {
                    return this.colorScale(v)
                }

                if (color) {
                    return color
                }

                return 'none'
            })
            .attr("stroke", (d) => {
                return strokeColor || 'none'
            })
            .attr("strokeWidth", (d) => {
                return strokeWidth || 0
            })
            .attr("d", d3.arc()     // imagine your doing a part of a donut plot
                .innerRadius(innerRadius)
                .outerRadius(d => this.yScale(d))
                .startAngle((d, i) => this.xScale(i) )
                .endAngle((d, i) => this.xScale(i) + this.xScale.bandwidth())
                .padAngle(0.01)
                .padRadius(innerRadius))

        rect.enter()
            .append("path")
            .attr("class", "frequency-bar")
            .attr("fill", "#69b3a2")

        //exit
        sel.exit().remove();
    }

    updateVis(data) {
        const {width, height, sampleSize, gap, hAlign, vAlign} = this.props.visArea

        const sel = d3.select(".frequency");
        const aggregatedData = data.slice(0, sampleSize);

        sel.selectAll("rect.frequency-bar")
            .data(aggregatedData)
    }

    render() {

        const {visArea} = this.props
        const {visType} = visArea
        const areaStyle = Utils.getStyles(visArea)
        if (areaStyle.borderRadius)
            delete areaStyle.borderRadius

        return (<div
            className='vis-element' style={areaStyle}>
            <div id={this.props.id}>
                {
                    visType !== 'Circular' &&
                    <svg
                        width={visArea.width}
                        height={visArea.height}>
                        <g
                            className={'frequency'}
                            width={visArea.width}
                            height={visArea.height}
                        />
                    </svg>
                }
                {
                    visType === 'Circular' &&
                    <svg
                        id={'radial'}
                        width={visArea.width}
                        height={visArea.height}>
                    </svg>
                }

            </div>
        </div>)
    }
}