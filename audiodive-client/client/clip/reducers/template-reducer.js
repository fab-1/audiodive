import update from 'immutability-helper';
import {
    RECEIVE_TEMPLATE,
    UPDATE_TEMPLATE,
    UPDATE_TEMPLATE_GLOBAL,
    UPDATE_TEMPLATE_CONFIG,
    UPDATE_TEMPLATE_LINKED_EL,
    RESET_TEMPLATE,
    FETCHING_TEMPLATE,
    SAVED_TEMPLATE,
    IMPORT_TEMPLATE
} from '../actions/template-actions'

import SHAPES from '../components/template/shapes';


const createInitialAreaObject = (object) => {
    switch(object.id) {
        case SHAPES.TEXT: return {
            color: "#000",
            fontFamily: "Montserrat",
            fontSize: 40,
            lineHeight: 1.5,
            fontWeight: 400,
            wordAnimation: "opacity",
            wordEasing: "easeOut",
            wordEffect: "Sine",
            wordScrolling: "wordbyword"
        }

        case SHAPES.DYNAMIC: return {}

        case SHAPES.PROGRESS: return {
            backgroundColor: 'rgba(255,255,255, 0.8)',
            color: 'rgba(0,0,0,0.9)'
        }

        case SHAPES.PARTICLES: return {
            config: {
                "particles": {
                    "number": {
                        "value": 200
                    },
                    "color": {
                        "value": "#eee"
                    },
                    "shape": {
                        "type": "circle"
                    },
                    "opacity": {
                        "value": 0.5,
                        "random": true,
                        "anim": {
                            "enable": false
                        }
                    },
                    "size": {
                        "value": 5,
                        "random": {
                            enable: true,
                            minimumValue: 1
                        },
                        "anim": {
                            "enable": false,
                        }
                    },
                    "line_linked": {
                        "enable": false
                    },
                    "move": {
                        "enable": true,
                        "speed": 4,
                        "direction": "top",
                        "random": true,
                        "straight": false,
                        "out_mode": "out"
                    }
                },
            }
        }

        case SHAPES.VISUALIZATION: return {
            opacity: 1,
            hslColor: {
                h: 75,
                s: 84,
                l: 69
            },
            type: 'bar',
            animateColor: true,
            colorVariation: {
                h: 0,
                s: 0,
                l: 0
            },
            hAlign: 'left',
            vAlign: 'bottom',
            sampleSize: 128,
            gap:1,
            bar: {}
        }
    }

    switch(object.type) {
        case SHAPES.IMAGE2:
            const {imgSrc} = object
            return {
                gifSettings: imgSrc.includes('gif')? {} : undefined,
                imgSrc
            }

        case SHAPES.HTML_TEXT:
            return {
                color: "#000",
                fontFamily: "Helvetica",
                fontSize: 40,
                lineHeight:1.5,
                content: 'Placeholder text'
            }
    }
}

const migrateImagesToNewFormat = (template) => {
    ['configVertical', 'configSquare', 'configWide'].forEach((key) => {
        const config = template[key]
        const {canvas, linkedElements} = config
        canvas && canvas.objects && canvas.objects.forEach(object => {
            if (object.type === 'image' && linkedElements[object.id]) {
                object.type = 'image2'
                object.imgSrc = object.src
                linkedElements[object.id].imgSrc = object.src
                delete object.src
            }
        })
    })

    return template
}

const getUpdates = (originalObject, propertyName, values) => {
    let newvalues = {$set: values}

    if (originalObject[propertyName] && typeof values === 'object' && values !== null && Object.keys(values).length) {

        newvalues = {}
        for (let key in values) {
            const value = values[key]

            if (typeof value === 'object' && value !== null && !value.length  && originalObject[propertyName][key]) {
                let newVal = {};
                Object.keys(value).forEach(k => newVal[k] = {$set: value[k]})
                newvalues[key] = newVal
                break
            }

            newvalues[key] = {$set: values[key]}
        }
    }

    return newvalues
}

const TemplateApi = {

    updateTemplate: (state, action) => {
        const {prop, val} = action
        return update(state, {[prop]:  {$set: val}})
    },

    //this just creates the config (linked objects), most of the code is just here to clean up old stuff convention
    updateLayoutConfig: (state, action) => {

        const {config, removedId, activeRatio} = action
        const template = state

        const templateConfig = template[activeRatio]
        const linkedElements = templateConfig.linkedElements

        let updates = {}
        let removes = {}

        config.objects.forEach(object => {
            let linkedElement

            if (linkedElements) {
                linkedElement = linkedElements[object.id]
            } else {
                linkedElement = templateConfig[object.id] //old convention
                removes[object.id] = {$set: undefined}
            }

            if (!linkedElement) {
                console.log('creating from', object)
                linkedElement = createInitialAreaObject(object)

                if (object.clonedFrom) {
                    console.log('cloning ' + object.clonedFrom)
                    linkedElement = JSON.parse(JSON.stringify(linkedElements[object.clonedFrom]))
                }
            }

            updates[object.id] = linkedElement
        })

        if (removedId) {
            updates[removedId] = undefined
        }

        const updated = {
            [activeRatio]: {
                canvas: {$set: config},
                linkedElements: {$set: updates},
                ...removes
            }}

        return update(state, updated)
    },

    updateGlobalObject: (state, action) => {

        const {objectName, values, activeRatio} = action
        const layout = state

        return update(state, {
            [activeRatio]: {
                [objectName]: getUpdates(layout[activeRatio], objectName, values)
            }
        })
    },

    updateLinkedElement: (state, action) => {
        const {objectName, values, activeRatio} = action
        const config = state[activeRatio]
        const elements = config.linkedElements

        return update(state, {
            [activeRatio]: {
                linkedElements: {[objectName]: getUpdates(elements, objectName, values)}
            }
        })
    }
}


const suffixedTemplate = (SUFFIX = '') => {

    return function reducer(state, action) {

        switch (action.type) {

            case UPDATE_TEMPLATE_GLOBAL + SUFFIX:
                state.touched = true
                return TemplateApi.updateGlobalObject(state, action)

            case UPDATE_TEMPLATE + SUFFIX:
                state.touched = true
                return TemplateApi.updateTemplate(state, action)

            case UPDATE_TEMPLATE_CONFIG + SUFFIX:
                state.touched = true
                return TemplateApi.updateLayoutConfig(state, action)

            case UPDATE_TEMPLATE_LINKED_EL + SUFFIX:
                state.touched = true
                return TemplateApi.updateLinkedElement(state, action)

            case RECEIVE_TEMPLATE + SUFFIX:
                let {template} = action
                template.touched = false

                template.configSquare.backgroundImage = undefined

                //nasty hack
                if (!template.configVertical) {
                    template.configVertical = {
                        canvas: {
                            version: "2.3.2",
                            backgroundColor:'rgba(0,0,0,0)',
                            objects: []
                        },
                        linkedElements: {dynamicArea: {}}
                    }
                }

                template = migrateImagesToNewFormat(template)

                return template

            case SAVED_TEMPLATE + SUFFIX:
                state.touched = false
                state.id = action.template.id
                return state

            case FETCHING_TEMPLATE + SUFFIX:
                return null

            case RESET_TEMPLATE + SUFFIX:
                return null

            case IMPORT_TEMPLATE + SUFFIX:
                const {fromRatio, toRatio} = action
                const fromConfig = state[fromRatio]
                let toConfig = JSON.parse(JSON.stringify(fromConfig))
                toConfig.linkedElements.dynamicArea = undefined
                toConfig.canvas.objects = toConfig.canvas.objects.filter(obj => obj.id !== 'dynamicArea')
                state[toRatio] = toConfig
                return state

            default:

                if (state === undefined)
                    return null

                return state
        }
    }

}



export default suffixedTemplate