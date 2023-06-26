import React, {Component} from 'react';
import PropTypes from 'prop-types';

class ResizableBar extends Component {

    constructor(){
        super()
        this.state = {
            startY:0,
            height: 0
        }

        this.handleMouseMove = this.onMouseMove.bind(this)
        this.handleMouseDown = this.onMouseDown.bind(this)
        this.handleMouseUp = this.onMouseUp.bind(this)
    }

    componentDidMount() {
        this.setState({
            height: this.props.height
        })
    }

    onStart(e) {
        this.setState({
            startY: e.pageY,
            startHeight: this.state.height
        });
    }

    onMove(e) {
        const minHeight = this.props.minHeight || 0
        const newHeight = this.state.startY + this.state.startHeight - e.pageY

        if (newHeight < this.props.height && newHeight > minHeight) {
            this.setState({
                height: newHeight
            })
        }
    }

    onMouseDown(e) {
        this.onStart(e);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        e.preventDefault();
    }

    onMouseUp(e) {
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);

        //snap
        if (this.props.height - this.state.height < 20) {
            this.setState({
                height: this.props.height
            })
        }

        if (this.state.height - this.props.minHeight < 20) {
            this.setState({
                height: this.props.minHeight
            })
        }

        document.dispatchEvent(new CustomEvent('audioResize', {}))

        e.preventDefault();
    }

    onMouseMove(e) {
        this.onMove(e);
        e.preventDefault();
    }


    render() {

        const {className, children, handleClassName} = this.props
        const {height} = this.state
        const style = {height: `${height}px`}

        return (
            <div className={className} style={style}>
                <div onMouseDown={this.handleMouseDown} className={handleClassName} />
                {children}
            </div>
        );
    }
}

ResizableBar.propTypes = {};

export default ResizableBar;