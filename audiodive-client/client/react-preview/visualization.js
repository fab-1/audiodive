import React from 'react'


class Vis extends React.Component {
    componentDidMount() {
        this.initVis()
    }

    reduceArray(d) {
        return d.reduce(function(a, x) {
            return a + x;
        }, 0) / d.length;
    }

    initVis(){

        const width = this.props.layout.config.dynamicArea.width;
        const height = this.props.layout.config.dynamicArea.height;

        var svg = d3.select('.svg');

        svg.attr("width", width);
        svg.attr("height", height);

        this.freq = svg.select(".frequency");

        this.freq.attr("width", width);
        this.freq.attr("height", height);

        this.xScale = d3.scaleLinear()
            .range([0, width])
            .domain([0, MAX_BARS]);

        this.yScale = d3.scaleLinear()
            .range([0, height])
            .domain([0, 255]);

        this.colorScale = d3.scaleLinear()
            .range([70, 90])
            .domain([255, 0]);

        this.hueScale = d3.scaleLinear()
            .range([200, 180])
            .domain([120, 50]);

        // Remove any rects already in the selector
        this.freq.selectAll("rect").remove();

        // Add a transparent rect so scaleY scales the appropriate height
        this.freq.append("rect")
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'background');
    }

    refreshVis(data) {

        const width = this.props.layout[this.props.ratioConfig].dynamicArea.width;
        const height = this.props.layout[this.props.ratioConfig].dynamicArea.height;

        const sel = d3.select(".frequency");
        var aggregatedData = data.slice(0, MAX_BARS);

        // Set the transform to force the scaleY
        sel.attr("style", "transform-origin: " + (width / 2) + "px " + (height / 2) + "px; transform: scaleY(-1);");

        var rect = sel.selectAll("rect.frequency-bar")
            .data(aggregatedData);

        rect.enter()
            .append("rect")
            .attr("x", (d, i) => {
                return this.xScale(i);
            })
            .attr("width", () => {
                return sel.attr("width") / MAX_BARS;
            })
            .attr("y", 0)
            .attr("class", "frequency-bar");

        var s = this.reduceArray(data.slice(0, 3));
        var h = this.reduceArray(data.slice(0, Math.floor(data.length / 3)));
        var l = this.reduceArray(data.slice(data));

        rect.attr("height", (d, i) =>  {
            var rectHeight = this.yScale(d);
            return (rectHeight < 0 ? 0 : rectHeight);
        }).attr("fill", (v) => `hsl(${this.hueScale(h)}, ${this.colorScale(s)}%, ${this.colorScale(v)}%)`);
    };

    render() {

        const props = this.props;

        this.refreshVis(props.audioData)

        const style = {
            display:'block',
            width: props.layout[this.props.ratioConfig].dynamicArea.width + 'px',
            height: props.layout[this.props.ratioConfig].dynamicArea.height + 'px'
        }

        return (<div className={'vis-bg'} style={style}>
            <svg className={'svg'}><g className={'frequency'}></g></svg>
        </div>)
    }
}