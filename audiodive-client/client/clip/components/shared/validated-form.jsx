import React from 'react';
import find from 'lodash/find';

export default ValidatedForm => class extends React.Component {

    constructor(props) {
        super(props);
        this.inputs = [];
    }

    addInput(input) {
        if (input && find(this.inputs, (a)=>{ return a.props.label === input.props.label }) == undefined){
            this.inputs.push(input);
        }
    }

    isValid() {
        var isValid = this.inputs.reduce((acc, val) => {
            var ret = (acc && val.checkValidity());
            return ret;
        }, true);

        return isValid;
    }
};