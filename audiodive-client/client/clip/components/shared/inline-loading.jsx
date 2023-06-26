import React from 'react';

class InlineLoading extends React.Component {

    render(){

        if (this.props.show) {
            return (<div className="inline-overlay"><i className={`fa ${this.props.icon? this.props.icon : 'fa-refresh'} fa-spin`}></i></div>);
        }
        else {
            return null
        }

    }
}

export default InlineLoading;