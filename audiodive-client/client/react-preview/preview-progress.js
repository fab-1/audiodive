import React, {Component} from 'react'
import {Utils} from '../shared/utils'
import PropTypes from 'prop-types'

class PreviewProgress extends Component {

    constructor() {
        super();

        this.state = {
            progress: 0.3
        }

        this.updateProgressBind = this.updateProgress.bind(this)
    }

    componentDidMount(){
        document.addEventListener('progress', this.updateProgressBind)
    }

    componentWillUnmount(){
        document.removeEventListener('progress', this.updateProgressBind)
    }

    updateProgress(data) {
        this.setState({
            progress: data.detail
        })
    }


    render() {

        const {config, editMode} = this.props
        const {progress} = this.state
        let style = Utils.getStyles(config)

        //We use custom element for the background
        delete style.backgroundColor

        const backgroundStyle = {
            width: '100%',
            height: '100%',
            backgroundColor: config.backgroundColor
        }

        const progressStyle = {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            backgroundColor: style.color,
            width: `${progress * 100}%`
        }

        return (
            <div
                style={style}
                className='layout-editor-dynamic-view-mode'>
                <div
                    id={this.props.id}
                    style={backgroundStyle}>
                    <div style={progressStyle} />
                </div>
            </div>
        )
    }
}

PreviewProgress.propTypes = {
}

PreviewProgress.defaultProps = {
    progress: 0.3
}

export default PreviewProgress
