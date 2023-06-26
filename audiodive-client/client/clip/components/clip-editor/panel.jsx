import * as Scroll from 'react-scroll';
import React from 'react';
import Draggable from 'react-draggable';
import store from 'store'
import {Icon, H4, Button, Tooltip} from '@blueprintjs/core'
import { ResizableBox } from 'react-resizable'
import {Motion, spring} from 'react-motion'
import UI_TEXT from '../../ui-text'
export default class Panel extends React.Component {

    constructor() {
        super()
    }

    componentDidMount() {
        this.handlePanelDrag = this.onPanelStop.bind(this)
    }

    onPanelStop(v, d) {
        const current = store.get(this.props.id) || {}
        this.props.id && store.set(this.props.id, Object.assign(current, {x: d.x, y: d.y}))
    }

    onResizeStop(e, v) {
        const current = store.get(this.props.id) || {}
        this.props.id && store.set(this.props.id, Object.assign(current, {height: v.size.height}))
    }

    render() {

        let defaultPos = {x:0, y:10, height: this.props.height || 460}
        // if (this.props.id && store.get(this.props.id)) {
        //     defaultPos = Object.assign(defaultPos, store.get(this.props.id))
        // }

        return (
            <Motion defaultStyle={{opacity: 0}} style={{opacity: spring(1, {stiffness: 200, damping: 20})}}>
                {interpolatingStyle =>
                    <Draggable
                        handle="h4"
                        grid={[2, 2]}
                        //bounds={'.draggable-area'}
                        defaultPosition={defaultPos}
                        onStop={this.handlePanelDrag}
                    >
                        <div style={interpolatingStyle} className={`draggable-panel bp3-elevation-1 ${this.props.className}`}>
                            <H4>
                                {this.props.icon?<Icon icon={this.props.icon} />:''}
                                {this.props.title}
                                {this.props.onClose && <Tooltip className='push-right' content={UI_TEXT.AM_MIN} >
                                    <Button minimal={true} small={true}  icon='minus' onClick={this.props.onClose} />
                                </Tooltip>}
                            </H4>
                            <ResizableBox
                                onResizeStop={this.onResizeStop.bind(this)}
                                className="draggable-panel-inner"
                                axis={'y'}
                                height={defaultPos.height}
                                width={this.props.width || 250}
                                minConstraints={[240, 300]}>
                                {this.props.content}
                            </ResizableBox>
                        </div>
                    </Draggable>}
            </Motion>
        )

    }
}