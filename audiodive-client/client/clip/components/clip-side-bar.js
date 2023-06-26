import React, { Fragment } from 'react'
import {Button} from '@blueprintjs/core'
import { Keyframes, Trail, animated, config } from 'react-spring/renderprops'
import delay from 'delay'
import {Classes, Intent} from "@blueprintjs/core/lib/esm/index"
import NiceButton from "./shared/nice-button"

const fast = { ...config.stiff, restSpeedThreshold: 1, restDisplacementThreshold: 0.01 }

// Creates a spring with predefined animation slots
const Sidebar = Keyframes.Spring({
    // single items,
    open: { to: { x: 0 }, config: config.default },
    // or async functions with side-effects
    close: async call => {
        await call({ to: { x: 100 }, config: config.gentle })
    }
})

// Creates a keyframed trail
const Content = Keyframes.Trail({
    open: { delay: 100, to: { x: 0, opacity: 1 } },
    close: { to: { x: 100, opacity: 0 } }
})

// const items = [
//     <Avatar src="https://semantic-ui.com/images/avatar2/large/elyse.png" />,
//     <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Username" />,
//     <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password" />,
//     <Fragment>
//         <Checkbox>Remember me</Checkbox>
//         <a className="login-form-forgot" href="#" children="Forgot password" />
//         <Button type="primary" htmlType="submit" className="login-form-button" children="Log in" />
//         Or <a href="#">register now!</a>
//     </Fragment>
// ]

class ClipSideBar extends React.Component {

    render() {

        const {items, stickToTop} = this.props
        const state = this.props.open ? 'open' : 'close'
        const toggle = this.props.open
        return (
            <Fragment>
                <Sidebar native state={state}>
                    {({ x }) => (
                        <animated.div className={"sidebar wide push-right " + (stickToTop?'stick-to-top':'') }style={{ transform: x.interpolate(x => `translate3d(${x}%,0,0)`) }}>

                            <Button
                                minimal={true}
                                className={'bp3-large'}
                                icon="cross"
                                onClick={this.props.onClose}
                            />
                            {/*<Button small={true} minimal={true} className={'close-button'} icon={'cross'} onClick={this.props.onClose} />*/}




                            <Trail
                                keys={items.map((_, i) => i)}
                                native
                                reverse={toggle}
                                initial={null}
                                items={items}
                                from={{ opacity: 0, x: 100 }}
                                to={{ opacity:  toggle? 1 : 0.25, x: toggle? 0 : 100 }}>
                                {item => ({ x, opacity }) => (
                                    <animated.div
                                        style={{
                                            opacity,
                                            transform: x.interpolate(x => `translate3d(${x}%,0,0)`),
                                        }}
                                    >
                                        {item}
                                    </animated.div>
                                )}
                            </Trail>


                        </animated.div>
                    )}
                </Sidebar>
            </Fragment>
        )
    }
}

export default ClipSideBar
