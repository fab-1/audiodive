import React from 'react';
import PropTypes from 'prop-types';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
import Regions from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import MinimapPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js';
import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor.min.js';
import throttle from 'lodash/throttle';
import sortedIndexBy from "lodash/sortedIndexBy"

const noop = () => {};

class Words extends React.Component {


    shouldComponentUpdate(nextProps) {

        if (nextProps.regionsArray !== this.props.regionsArray) {
            return true
        }

        // if (nextProps.section !== this.props.section) {
        //     return true
        // }

        return false
    }


    render() {

        const { regionsArray, renderSelectedRegion } = this.props

        if (!regionsArray) return <span />

        return regionsArray.map(region => {

            const style = {
                left: `${region.element.offsetLeft}px`,
                width: `${region.element.offsetWidth}px`
            };

            return <div key={region.id} className="selected-region-overlay" style={style}>
                {
                    renderSelectedRegion(region.id)
                }
            </div>
        })
    }
}


export default class WavesurferComponent extends React.Component {

    constructor() {
        super();
        this.state = {
            isReady:false,
            selectedRegionStyle: {
                position: 'absolute',
                background: 'red'
            }
        }

        this.sortedIds = []
        this.touchedRegions = {} //This keeps track of all the regions that are automatically updated when dragging
        //this.cursorRef = React.createRef();

        this.throttlePosChange = throttle(this.updateCursorPos, 100)
    }

    componentDidMount() {

        let plugins = [
            Regions.create()
        ]

        if (this.props.timelineOptions) {
            plugins.push(TimelinePlugin.create(Object.assign({
                container: this.timelineEl
            }, this.props.timelineOptions)))
        }

        if (this.props.showCursor) {
            plugins.push(CursorPlugin.create({showTime: true}))
        }

        // if (this.props.microphone) {
        //     plugins.push(MicrophonePlugin.create())
        // }

        const options = Object.assign({
            container: this.el,
            waveColor: 'rgba(0, 116, 217, 0.6)',
            progressColor: 'rgba(0, 116, 217, 1)',
            normalize: true,
            cursorWidth: 2,
            cursorColor: 'rgba(0,0,0,0.8)',
            height:160,
            responsive: true,
            plugins: plugins
        }, this.props.options)

        this.wavesurferInstance = WaveSurfer.create(options)



        this.wavesurferInstance.on('finish', (this.props.onFinish? this.props.onFinish : noop))
        this.wavesurferInstance.on('ready', e => {
            this.setState({isReady: true})
            this.props.onReady({wavesurfer: this.wavesurferInstance})
            this.refreshRegions()
        })

        this.wavesurferInstance.on('waveform-ready', e => {
            this.setState({isReady: true})
            this.props.waveformReady({wavesurfer: this.wavesurferInstance})


        })

        if (this.props.src) {
            this.loadMedia()
        }

        this.wavesurferInstance.on('audioprocess', pos =>  {

            this.props.onPosChange(this.wavesurferInstance.getCurrentTime())
            this.throttlePosChange()
        });

        this.wavesurferInstance.on('play', pos =>  {
            this.props.onPlay()
        });

        this.wavesurferInstance.on('pause', pos =>  this.props.onPause());

        this.wavesurferInstance.on('region-in', region =>  this.props.onRegionIn({region: region}));

        this.wavesurferInstance.on('region-out', region =>  this.props.onRegionOut({region: region}));

        this.wavesurferInstance.on('region-created', region =>  this.props.onRegionCreated({region: region}));

        this.wavesurferInstance.on('region-updated', region =>  {
            this.props.onRegionUpdated({region: region})
            this.refreshSelectedRegionBox(region);
            this.checkPrevious(region)
            this.checkNext(region)
            this.touchedRegions[region.id] = true
        });

        this.wavesurferInstance.on('region-update-end', region => {


            setTimeout(_ => {

                const words = this.wavesurferInstance.regions.list
                let updates = {}
                Object.keys(this.touchedRegions).forEach(wordId => {
                    const currentWord = words[wordId]
                    if (currentWord) {
                        const {start, end} = currentWord
                        updates[wordId] = {start, end}
                    }
                    else {
                        console.error('weird bug in region-update-end')
                    }
                })
                this.props.onRegionUpdateEnd(updates, {region: region})

            }, 20)

        })

        this.wavesurferInstance.on('region-removed', region =>  this.props.onRegionRemoved({region: region}));

        this.wavesurferInstance.on('region-click', region =>  this.props.onRegionClick({region: region}));

        this.wavesurferInstance.on('region-dblclick', region =>  this.props.onRegionDblclick({region: region}));

        this.wavesurferInstance.on('finish', e => this.props.onFinish())

        // `audioprocess` is not fired when seeking, so we have to plug into the
        // `seek` event and calculate the equivalent in seconds (seek event
        // receives a position float 0-1) – See the README.md for explanation why we
        // need this
        this.wavesurferInstance.on('seek', pos => {
            if (this.state.isReady) {
                this.props.onPosChange(this.wavesurferInstance.getCurrentTime())
            }
            this.updateCursorPos()
        })

        document.querySelector('.wavesurfer-container').addEventListener('mousewheel', function(e) {
            this.scrollLeft -= (e.wheelDelta);
            e.preventDefault();
        }, false);
    }

    loadMedia() {
        if (this.props.audioPeaks) {
            this.wavesurferInstance.load(this.props.src, this.props.audioPeaks)
        }
        else {
            if (this.props.options.backend === 'MediaElement') {
                this.audioElement = new Audio(this.props.src)
                this.audioElement.crossOrigin = 'true'
                this.wavesurferInstance.loadMediaElement(this.audioElement)
            }
            else {
                this.wavesurferInstance.load(this.props.src)
            }
        }
    }

    getCursorPos() {
        if (!this.waveDomElement) {
            this.waveDomElement =  document.querySelector('wave wave')
        }

        if (!this.waveDomElement) return 0

        return this.waveDomElement.offsetWidth;
    }

    updateCursorPos() {

        const cursorPos = this.getCursorPos()

        if (!this.wavesurferContainer) {
            this.wavesurferContainer = document.querySelector('.wavesurfer-container');
        }

        if (this.wavesurferContainer.scrollLeft + this.wavesurferContainer.offsetWidth < cursorPos) {
            this.wavesurferContainer.scrollLeft = cursorPos - 100;
        }

        if (this.wavesurferContainer.scrollLeft > cursorPos + this.wavesurferContainer.offsetWidth) {
            this.wavesurferContainer.scrollLeft = cursorPos - 100;
        }

    }

    componentDidUpdate(prevProps) {

        //console.log(prevProps)

        if (prevProps.playing !== this.props.playing) {

            if (this.props.playing && !this.props.regionPlaying) {
                this.wavesurferInstance.play()
            }
            else {
                this.wavesurferInstance.pause()
            }
        }

        if (prevProps.regionPlaying !== this.props.regionPlaying) {
            if (this.props.regionPlaying && this.wavesurferInstance.regions.list[this.props.regionPlaying]) {
                this.wavesurferInstance.regions.list[this.props.regionPlaying].play()
            }
        }

        if (this.props.src == null && prevProps.src != null) {
            //we just reset the source => empty
            this.wavesurferInstance.empty()
        }

        if (this.props.src && prevProps.src !== this.props.src) {
            this.loadMedia()
        }

        if (this.props.currentTime && prevProps.currentTime !== this.props.currentTime) {
            //this.loadMedia()
        }

        if (this.props.audioRate && prevProps.audioRate !== this.props.audioRate) {
            this.wavesurferInstance.setPlaybackRate(this.props.audioRate)
        }

        if (!this.props.regions && prevProps.regions) {
            this.wavesurferInstance.clearRegions()
        }

        if (this.props.regions && prevProps.regions !== this.props.regions) {
            this.refreshRegions()
        }

        if (this.props.section && prevProps.section !== this.props.section) {
            this.refreshRegions()
        }

        if (prevProps.selectedRegionId !== this.props.selectedRegionId) {
            this.selectRegion(this.props.selectedRegionId)
        }
    }

    selectRegion(regionId) {

        //clear existing
        let existing = document.querySelector('.selected-region')
        if (existing) {
            existing.classList.remove('selected-region')
        }

        //select new
        let region = this.wavesurferInstance.regions.list[regionId]
        if (region) {
            region.element.classList.add('selected-region')
            //this.refreshSelectedRegionBox(region)
        }
    }

    setLastRegion(regionId) {

        //clear existing
        let existing = document.querySelector('.last-region')
        if (existing) {
            existing.classList.remove('last-region')
        }

        //select new
        let region = this.wavesurferInstance.regions.list[regionId]
        if (region) {
            region.element.classList.add('last-region')
            //this.refreshSelectedRegionBox(region)
        }
    }

    checkNext(region) {

        const index = this.regionsArray.findIndex(r => r.id === region.id)

        let i = index + 1
        let next = this.regionsArray[i]

        if (!next) return

        let delta = region.start + 0.08 - region.end

        if (delta > 0) {

            //region.onDrag(delta)
            region.onResize(delta, 'end')
            next.onResize(delta, 'start')
        }
        // else {
        //     //prev.onResize(region.start - prev.end, 'end')
        // }
    }

    checkPrevious(region) {

        const index = this.regionsArray.findIndex(r => r.id === region.id)

        let i = index - 1
        let prev = this.regionsArray[i]

        if (!prev) return

        let delta = region.start - prev.start - 0.08
        if (delta < 0) {
            prev.onDrag(delta)
        }
        else {
            const diff = region.start - prev.end

            if (diff) {
                prev.onResize(diff, 'end')
                this.touchedRegions[prev.id] = true
            }
        }
    }

    refreshSelectedRegionBox() {

        const regions = this.wavesurferInstance.regions.list
        let region = regions[this.props.selectedRegionId];

        if (region) {

            this.setState({
                selectedRegionStyle: {
                    left: `${region.element.offsetLeft}px`,
                    width: `${region.element.offsetWidth}px`
                }
            })
        }
    }

    refreshRegions(){
        //this.wavesurferInstance.clearRegions()
        let localRegions = this.wavesurferInstance.regions.list;
        for (let regionId in this.props.regions) {
            let localRegion = localRegions[regionId];
            let newRegion = this.props.regions[regionId];
            newRegion.drag = false
            newRegion.minLength = 0.1

            //adding
            if (!localRegion) {
                if (newRegion.start !== undefined && newRegion.start !== null)
                    this.wavesurferInstance.addRegion(newRegion)
            }
            else {

                if (localRegion.start !== newRegion.start) {
                    localRegion.start = newRegion.start
                    localRegion.updateRender()
                }

                if (localRegion.end !== newRegion.end) {
                    localRegion.end = newRegion.end
                    localRegion.updateRender()
                }

                if (newRegion.start === undefined || newRegion.start === null) {
                    localRegion.remove()
                }
            }
        }

        //by now all missing regions are added, let's clean up any surplus
        for (let regionId in localRegions) {
            if (!this.props.regions[regionId]) {
                localRegions[regionId].remove()
            }
        }

        this.regionsArray = []
        let updated = this.wavesurferInstance.regions.list;
        for (let regionId in updated) this.regionsArray.push(updated[regionId])
        this.regionsArray.sort((a, b) => a.start - b.start)

        if (this.regionsArray.length)
            this.setLastRegion(this.regionsArray[this.regionsArray.length - 1].id)

        this.forceUpdate()

    }

    componentWillUnmount() {
        //this.$el.off('change', this.handleChange);
        //this.$el.chosen('destroy');
        this.wavesurferInstance.destroy()
    }

    handleChange(e) {

    }

    render() {

        const {section} = this.props

        const cursorPos = this.getCursorPos()

        return (
            <div className={this.props.className}>
                <div className="wavesurfer-wrapper" ref={el => this.el = el}></div>
                <div className="timeline-wrapper" ref={el => this.timelineEl = el}></div>
                {/*<div className="selected-region-overlay" style={this.state.selectedRegionStyle}>*/}
                    {/*{*/}
                        {/*this.props.renderSelectedRegion(this.props.selectedRegionId)*/}
                    {/*}*/}
                {/*</div>*/}

                <Words
                    section={section}
                    regionsArray={this.regionsArray}
                    renderSelectedRegion={this.props.renderSelectedRegion}
                    selectedRegionStyle={this.state.selectedRegionStyle}
                />

                {
                    !this.props.playing && <div style={{left: `${cursorPos}px`}} className='wavesurfer-cursor'>
                        {
                            this.props.renderCustomCursor
                        }
                    </div>
                }


                {this.props.children}
            </div>
        );
    }
}

WavesurferComponent.propTypes = {
    options: PropTypes.object,
    onPosChange: PropTypes.func,
    onReady: PropTypes.func
};

WavesurferComponent.defaultProps = {
    className: '',
    playing: false,
    responsive: true,
    showCursor: true,
    onReady: noop,
    waveformReady: noop,
    onPosChange: noop,
    onRegionIn: noop,
    onRegionOut: noop,
    onRegionCreated: noop,
    onRegionUpdated: noop,
    onRegionUpdateEnd: noop,
    onRegionRemoved: noop,
    onRegionClick: noop,
    onRegionDblclick: noop,
    onPlay: noop,
    onFinish: noop,
    onPause: noop,
    renderSelectedRegion: () => <span></span>,
    renderCustomCursor: <span></span>
};