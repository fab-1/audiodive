import React from 'react';

class InputWrapper extends React.Component {

    constructor() {
        super();
        this.state = {
            validity: {
                valid: true
            }
        };

        this.ERROR_MESSAGES = {
            badInput: 'Incorrect Input',
            patternMismatch: 'Incorrect Format',
            rangeOverflow: 'The number is too high',
            rangeUnderflow: 'The number is too low',
            tooLong: 'The text is too long',
            tooShort: 'The text is too short',
            valueMissing: 'The value cannot be empty'
        };

        this.INPUT_TYPES = ['textarea', 'input'];
    }

    componentDidMount() {

        if (this.props.children == undefined || (this.props.children.length && this.props.children.length != 1)){
            //throw new Error("WrappedInput requires only 1 child element");
        }

        //console.log(this.wrapper);

    }

    onChange(val) {
        this.checkValidity();
    }

    setInputElement(wrapper){

        if (!this.inputElement && wrapper) {

            let inputFound = null;
            this.INPUT_TYPES.forEach((inputType) => {
                var inputs = wrapper.getElementsByTagName(inputType);
                if (inputs.length) {
                    inputFound = inputs[0];
                }
            });

            if (inputFound) {
                this.inputElement = inputFound;
                this.inputElement.addEventListener('change', this.onChange.bind(this));
                this.inputElement.addEventListener('keyup', this.onChange.bind(this));
            }
        }

    }

    checkValidity() {
        //console.log(this.inputElement.validity);
        this.setState({
            validity: this.inputElement.validity
        });

        return this.inputElement.validity.valid;
    }

    getErrorBlocks() {
        if (!this.state.valid){
            const errors = [];
            for (var key in this.ERROR_MESSAGES) {
                if (this.state.validity[key]) {
                    errors.push(this.ERROR_MESSAGES[key]);
                }
            }
            return errors.map((error, index) => {
                return <span key={index} className="help-block">{error}</span>
            });
        }
        return [];
    }

    getErrorClass() {
        return (this.state.validity.valid? 'form-group' : 'form-group has-error')
    }

    render(){

        return (
            <div ref={(wrapper) => { this.setInputElement(wrapper) }} className={this.getErrorClass()}>
                <label className="control-label">{this.props.label}</label>
                {this.props.children}
                {
                    this.getErrorBlocks().map((error) => error)
                }
            </div>
        )

    }
}

export default InputWrapper;