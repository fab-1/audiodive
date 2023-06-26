import React from 'react';

import {Spinner, Intent} from "@blueprintjs/core"

class Loading extends React.Component {

    render(){

        let style = {}

        if (this.props.opacity) {
            style.opacity = this.props.opacity
        }

        if (this.props.show) {
            return (<div style={style} className={'overlay ' + this.props.className}>
                <Spinner intent={Intent.PRIMARY} />
            </div>);
        }
        else {
            return null
        }

    }
}

export default Loading;