import axios from "axios"
import dayjs from 'dayjs'
import {receiveClip} from './clip-actions'

export const FETCH_CURRENT_USER = 'FETCH_CURRENT_USER'
export function fetchCurrentUser() {
    return (dispatch, getState) => {

        return axios.get(`/admin/api/user/current`)
            .then(response => {
                dispatch(receiveCurrentUser(response.data))
            })
    }
}

export const LOGOUT_CURRENT_USER = 'LOGOUT_CURRENT_USER'
export function logout() {
    return (dispatch, getState) => {

        return axios.get(`/api/v1/account/logout`)
            .then(response => {
                dispatch(fetchCurrentUser())
            })
    }
}

export const RECEIVE_CURRENT_USER = 'RECEIVE_CURRENT_USER'
function receiveCurrentUser(user) {
    return {
        type: RECEIVE_CURRENT_USER,
        user
    }
}