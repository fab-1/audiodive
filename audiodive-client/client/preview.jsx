import React from 'react'
import ReactDOM from 'react-dom'
import PreviewIndex from './react-preview/preview-index.jsx'

class Preview extends React.Component {

    constructor() {
        super();


        this.clip = JSON.parse(document.body.dataset.clip);
        this.layoutConfigs = JSON.parse(document.body.dataset.layouts);

    }

    componentDidMount() {
        document.addEventListener('keydown', event => {

            if (event.code == 'Space') {

                if (!this.audioElement) {
                    this.audioElement = document.createElement('audio');
                    this.audioElement.src = this.clip.audioUrl;
                }

                this.count = 0;

                if (this.playerInterval) {
                    this.audioElement.pause();
                    clearInterval(this.playerInterval);
                    this.playerInterval = null;
                }
                else {
                    this.audioElement.play();
                    this.playerInterval = setInterval(() => {
                        const time = this.audioElement.currentTime * 1000;
                        const frame = Math.floor(time/25);
                        if (this.count < frame) {
                            this.count = frame;
                            this.appInstance.nextStep()
                        }
                    }, 5)
                }
            }

            if (event.code == 'ArrowUp') {
                if (this.playerInterval) { clearInterval(this.playerInterval); this.playerInterval = null; }
                else {
                    this.playerInterval = setInterval(() => this.appInstance.nextStep(), 10);
                }
            }


            if (event.code == 'ArrowRight') {
                this.appInstance.nextStep()
            }

            if (event.code == 'KeyN') {
                this.appInstance.nextStep()
            }

            if (event.code == 'ArrowDown') {
                this.appInstance.seek(111);
            }

        })
    }

    render() {
        return (<PreviewIndex
            clip={this.clip}
            layouts={this.layoutConfigs}
            onPreviewReady={() => {
                this.appInstance.nextStep();
                this.props.onPreviewReady();
            }}
            ref={ref => {
                if (ref) {
                    window.appInstance = ref
                    this.appInstance = ref
                }
            }}
        />)
    }
}

const ApplicationReady = new Promise((resolve, reject) => {
    ReactDOM.render((
        <Preview
            onPreviewReady={resolve}
        />
    ), document.getElementById('react-preview'));
})


const ApplicationTimeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
        clearTimeout(id)
        reject('Timed out!')
    }, 60000)
})

const AppStatus = Promise.race([
    ApplicationReady,
    ApplicationTimeout
])

window.appStatus = () => {
    return AppStatus;
}

window.appStatus().then(e => console.log('all ready'))