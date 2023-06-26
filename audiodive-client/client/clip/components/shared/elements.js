import SHAPES from "../template/shapes";

export const TYPES = {
    TEXT: 'textArea',
    VISUALIZATION: 'visArea',
    DYNAMIC: 'dynamicArea',
    HTML_TEXT: 'htmlText',
    PROGRESS: 'progress',
    IMAGE: 'image',
    IMAGE2: 'image2',
    PARTICLES: 'particles'
}

export const UNIQUE_ELEMENTS = [
    TYPES.TEXT,
    TYPES.VISUALIZATION,
    TYPES.DYNAMIC,
    TYPES.PROGRESS,
    TYPES.PARTICLES
]

export const TYPES_LABELS = {
    [TYPES.TEXT]: 'Captions',
    [TYPES.HTML_TEXT]: 'Static Text',
    [TYPES.VISUALIZATION]: 'Visualizer',
    [TYPES.DYNAMIC]: 'Dynamic Area',
    [TYPES.PROGRESS]: 'Progress Bar',
    [TYPES.IMAGE]: 'Image',
    [TYPES.IMAGE2]: 'Image',
    [TYPES.PARTICLES]: 'Particles'
}


export const TYPES_ICONS = {
    [TYPES.TEXT]: 'comment',
    [TYPES.HTML_TEXT]: 'new-text-box',
    [TYPES.VISUALIZATION]: 'timeline-bar-chart',
    [TYPES.DYNAMIC]: 'desktop',
    [TYPES.PROGRESS]: 'segmented-control',
    [TYPES.IMAGE]: 'media',
    [TYPES.IMAGE2]: 'media',
    [TYPES.PARTICLES]: 'snowflake'
}

export const getType = (obj) => {

    if (UNIQUE_ELEMENTS.includes(obj.id)) {
        return obj.id
    }

    return obj.type
}

export default {
    TYPES,
    TYPES_LABELS,
    TYPES_ICONS,
    getType
}