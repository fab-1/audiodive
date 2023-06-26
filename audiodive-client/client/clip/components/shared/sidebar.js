import React, {Component} from 'react';
import PropTypes from 'prop-types';

class Sidebar extends Component {

    componentDidMount() {
        document.addEventListener('audioResize', _ => this.forceUpdate())
    }


    render() {

        //const height = `${document.body.clientHeight}px`

        let style = {}

        let className = 'sidebar'

        if (this.props.right) {
            className += ' push-right'
        }

        if (this.props.large) {
            className += ' large'
        }

        if (this.props.fixed) {
            className += ' fixed'
        }

        if (this.props.className) {
            className += ' ' + this.props.className
        }

        if (this.props.fill) {
            style.maxWidth = `${window.innerWidth - 258}px`
            style.padding = '86px 100px'
        }

        //const audioBar = document.querySelector('.audio-background')
        //const bottom = audioBar? audioBar.clientHeight+'px':0

        return (
            <div id={this.props.id} className={className} style={style}>
                {this.props.children}
            </div>
        );
    }
}

Sidebar.propTypes = {};

export default Sidebar;