import React, {Component} from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const intentClasses = (intent) => {

    if (!intent) {
        return ''
    }

    const intentToClass = {
        'primary': 'bu-is-primary',
        'success' : 'bu-is-success',
        'warning' : 'bu-is-warning',
        'danger' : 'bu-is-danger',
        'info' : 'bu-is-info',
        'link' : 'bu-is-link'
    }

    return intentToClass[intent]
}

class NiceButton extends Component {

    state = {

    }

    getCommonButtonProps(){
        const { selected, fill, large, loading, minimal, small, tabIndex, intent, inverted, type, light } = this.props;
        const disabled = this.props.disabled || loading;

        const className = classNames(
            'bu-button',
            {
                'bu-is-selected': selected,
                'bu-is-light': light,
                'bu-is-medium': large,
                'bu-is-loading' : loading,
                'bu-is-inverted' : inverted,
                'bu-is-outlined' : minimal,
                'bu-is-small' : small,
                'bu-is-fullwidth' : fill,
                'bu-is-active': this.state.isActive || this.props.active,
            },
            intentClasses(intent),
            this.props.className
        );

        return {
            className,
            disabled,
            onClick: disabled ? undefined : this.props.onClick,
            tabIndex: disabled ? -1 : tabIndex,
            type
        };
    }

    render() {

        const { children, icon, rightIcon, text, href } = this.props;


        let content = text || children

        if (icon) {
            content = <React.Fragment>
                <span className="bu-icon bu-is-small">
                  <i className={`fas fa-${icon}`}></i>
                </span>
                {text && <span> {text} </span>}
            </React.Fragment>
        }

        return (
            href?
            <a href={href} {...this.getCommonButtonProps()}>
                {
                    content
                }
            </a>:
            <button type="button" {...this.getCommonButtonProps()}>
                {
                    content
                }
            </button>
        )
    }
}

NiceButton.propTypes = {}

export default NiceButton
