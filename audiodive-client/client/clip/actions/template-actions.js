import axios from 'axios'
import shortId from "shortid"
import kebabCase from "lodash/kebabCase"
import RATIO from '../../shared/video-ratio'

const DYNAMIC_MEDIA_SQUARE = {
    "type": "rect",
    "version": "2.3.3",
    "originX": "left",
    "originY": "top",
    "left": 0,
    "top": 0,
    "width": 720,
    "height": 720,
    "fill": "rgba(0,0,0,0)",
    "stroke": null,
    "strokeWidth": 1,
    "strokeDashArray": null,
    "strokeLineCap": "butt",
    "strokeLineJoin": "miter",
    "strokeMiterLimit": 4,
    "scaleX": 1,
    "scaleY": 1,
    "angle": 0,
    "flipX": false,
    "flipY": false,
    "opacity": 1,
    "shadow": null,
    "visible": true,
    "clipTo": null,
    "backgroundColor": "",
    "fillRule": "nonzero",
    "paintFirst": "fill",
    "globalCompositeOperation": "source-over",
    "transformMatrix": null,
    "skewX": 0,
    "skewY": 0,
    "rx": 0,
    "ry": 0,
    "id": "dynamicArea",
    "name": "Media Layer"
}

const DYNAMIC_MEDIA_WIDE = Object.assign({width: 1280}, DYNAMIC_MEDIA_SQUARE)


export const RECEIVE_TEMPLATE = 'RECEIVE_TEMPLATE'
export function receiveTemplate(template) {
    return {
        type: RECEIVE_TEMPLATE,
        template
    }
}


export const IMPORT_TEMPLATE = 'IMPORT_TEMPLATE'
export function importTemplate(template, fromRatio, toRatio) {
    return {
        type: IMPORT_TEMPLATE,
        template,
        fromRatio,
        toRatio
    }
}

export const SAVED_TEMPLATE = 'SAVED_TEMPLATE'
function savedTemplate(template, readOnly) {
    return {
        type: SAVED_TEMPLATE,
        template
    }
}

export const SAVING_TEMPLATE = 'SAVING_TEMPLATE'
function savingTemplate(clipId, readOnly) {
    return {
        type: SAVING_TEMPLATE,
        clipId
    }
}
export const FETCHING_TEMPLATE = 'FETCHING_TEMPLATE'
function fetchingTemplate(clipId, readOnly) {
    return {
        type: FETCHING_TEMPLATE,
        clipId
    }
}

export const FETCH_TEMPLATE = 'FETCH_TEMPLATE'
export function fetchTemplate(clipId) {
    return (dispatch, getState) => {

        dispatch(fetchingTemplate(clipId))

        return axios.get(`/admin/api/template/${clipId}`)
            .then(response => dispatch(receiveTemplate(response.data)))
    }
}

export const SAVE_TEMPLATE = 'SAVE_TEMPLATE'
export function saveTemplate() {
    return (dispatch, getState) => {

        dispatch(savingTemplate())

        const template = getState().template.present

        const req = template.id === 'new' || template.id === 'clone'?
                    axios.post(`/admin/api/template`, template):
                    axios.patch(`/admin/api/template/`+ template.id, template)

        req.then(response => dispatch(savedTemplate(response.data)))
        return req
    }
}

export const UPDATE_TEMPLATE = 'UPDATE_TEMPLATE'
export function updateTemplate(prop, val, readOnly) {
    return {
        type: UPDATE_TEMPLATE,
        prop, val
    }
}


export const RESET_TEMPLATE = 'RESET_TEMPLATE'
export function resetTemplate(readOnly) {
    return {
        type: RESET_TEMPLATE
    }
}

export function createTemplate(baseTemplate) {

    let blankTemplate = baseTemplate || {
        id: 'new',
        name: 'New Template'
    }

    RATIO.ITEMS.forEach(ratio => {
        blankTemplate[ratio] = {
            canvas: {
                version: "2.3.2",
                    backgroundColor:'rgba(0,0,0,0)',
                    objects: []
            },
            linkedElements: {}
        }
    })

    return blankTemplate
}


export const UPDATE_TEMPLATE_CONFIG = 'UPDATE_TEMPLATE_CONFIG'
export function updateLayoutConfig(config, activeRatio, removedId) {
    return {
        type: UPDATE_TEMPLATE_CONFIG,
        activeRatio,
        config,
        removedId
    }
}

export const UPDATE_TEMPLATE_GLOBAL = 'UPDATE_TEMPLATE_GLOBAL'
export function updateGlobal(objectName, values, activeRatio, readOnly) {
    return {
        type: UPDATE_TEMPLATE_GLOBAL,
        objectName, values, activeRatio
    }
}

export const UPDATE_TEMPLATE_LINKED_EL = 'UPDATE_TEMPLATE_LINKED_EL'
export function updateLinkedElement(objectName, values, activeRatio) {
    return {
        type: UPDATE_TEMPLATE_LINKED_EL,
        objectName, values, activeRatio
    }
}

export const UNDO_TEMPLATE = 'UNDO_TEMPLATE'
export function undoTemplate(values) {
    return {
        type: UNDO_TEMPLATE
    }
}

export const REDO_TEMPLATE = 'REDO_TEMPLATE'
export function redoTemplate(values) {
    return {
        type: REDO_TEMPLATE
    }
}
