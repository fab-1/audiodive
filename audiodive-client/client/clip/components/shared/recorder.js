import React, {Component} from 'react'
import PropTypes from 'prop-types'
import 'video.js/dist/video-js.css';
import videojs from 'video.js';

import WaveSurfer from 'wavesurfer.js';

import 'webrtc-adapter';
import RecordRTC from 'recordrtc';

import MicrophonePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.microphone.js';
WaveSurfer.microphone = MicrophonePlugin;

import 'videojs-wavesurfer/dist/css/videojs.wavesurfer.css';
import Wavesurfer from 'videojs-wavesurfer/dist/videojs.wavesurfer.js';

import 'videojs-record/dist/css/videojs.record.css';
import Record from 'videojs-record/dist/videojs.record.js';

class AudioRecorder extends Component {

    videoJsOptions = {
        controls: true, //ideally we
        width: 400,
        height: 200,
        //fluid: true,
        plugins: {
            wavesurfer: {
                src: 'live',
                debug: true,
                waveColor: '#137CBD',
                progressColor: '#137CBD',
                cursorColor: 'rgba(0,0,0,0)',
                hideScrollbar: true,
                barHeight: 1,
                barWidth: 2,
                minPxPerSec:1000,
            },
            record: {
                audio: true,
                video: false,
                maxLength: 150,
                audioRecorderType: RecordRTC.StereoAudioRecorder,
                debug: true
            }
        }
    }

    state = {
        message: 'Hi'
    }

    componentDidMount() {

        const {onRecordingReady, onReady, onError} = this.props


        // instantiate Video.js
        this.player = videojs(this.audioNode, this.videoJsOptions, () => {
            // print version information at startup
            var version_info = 'Using video.js ' + videojs.VERSION +
                ' with videojs-wavesurfer ' + videojs.getPluginVersion('wavesurfer') +
                ' and wavesurfer.js ' + WaveSurfer.VERSION;
            console.log(version_info);
        })

        this.player.on('startRecord', function() {
            console.log('started recording!');
        })

        this.player.on('deviceReady', () => {
            console.log('device is ready!');
            onReady(this.player)
        });

        this.player.on('finishRecord', () => {
            // the recordedData object contains the stream data that
            // can be downloaded by the user, stored on server etc.
            console.log('finished recording: ', this.player.recordedData);
            onRecordingReady(this.player.recordedData)
        })

        this.player.on('waveReady', (event) => {
            console.log('waveform: ready!');
        })

        this.player.on('playbackFinish', (event) => {
            console.log('playback finished.');
        })

        // error handling
        this.player.on('error', (element, error) => {
            console.error(error, element)
            onError(error)
        })
    }

    componentDidUpdate(prevProps, prevState){
        if (prevProps.recording !== this.props.recording) {
            if (this.props.recording) {
                this.player.record().start()
            }
            else {
                this.player.record().stop()
            }
        }

        if (prevProps.playing !== this.props.playing && this.props.playing) {
            console.log(this.player)
            this.player.play()
        }
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose()
        }
    }

    logMessage = () => {
        // This works because arrow funcs adopt the this binding of the enclosing scope.
        console.log(this.state.message);
    }

    render() {
        return (
            <audio
                id="myAudio"
                ref={node => this.audioNode = node}
                className="video-js audio-recorder"
            />
        )
    }
}

AudioRecorder.propTypes = {}

export default AudioRecorder
