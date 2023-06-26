import {
    RECEIVE_CURRENT_USER
} from '../actions/user-actions'

const reducer = (state, action) => {

    const newState = state || {}

    switch (action.type) {

        case RECEIVE_CURRENT_USER:
            const {user} = action
            newState.currentUser = user
            return {...newState}

        default:
            return newState
    }

}

export default reducer