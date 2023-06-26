import React from 'react';


let hasLocalStorage = localStorage

if (hasLocalStorage) {
    let testKey = 'react-localstorage.hoc.test-key';
    try {
        // Access to global `localStorage` property must be guarded as it
        // fails under iOS private session mode.
        localStorage.setItem( testKey, 'foo' )
        localStorage.removeItem(testKey)
    } catch (e) {
        hasLocalStorage = false;
    }
}

const withStorage = (Component, name, propsToSave = [], defaultState) => {

    if( !hasLocalStorage ) return Component

    return class LocalStorageComponent extends React.Component {

        constructor(props) {
            super(props)

            console.log('hoc')
        }

        componentDidMount() {

            const savedState = Object.assign(defaultState, JSON.parse(localStorage.getItem(name)))

            let newState = {}

            Object.keys(savedState).forEach(prop => {

                if (propsToSave && propsToSave.includes(prop)) {

                    newState[prop] = savedState[prop]
                }

            })

            this.setState(newState)
        }

        componentDidUpdate(){
            let stateToSave = {}

            console.log('updated')

            Object.keys(this.state).forEach(prop => {

                if (propsToSave && propsToSave.includes(prop)) {
                    console.log(prop, this.state[prop])
                    stateToSave[prop] = this.state[prop]
                }

            })

            localStorage.setItem( name, JSON.stringify( stateToSave ))
        }

        render() {
            // Wraps the input component in a container, without mutating it. Good!
            return <Component {...this.props} />;
        }
    }
}

export default withStorage