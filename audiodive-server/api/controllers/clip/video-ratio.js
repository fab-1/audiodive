
const CONFIG_KEY = {
    WIDE: 'configWide',
    SQUARE: 'configSquare',
    VERTICAL: 'configVertical'
}
const ITEMS = [
    CONFIG_KEY.WIDE, CONFIG_KEY.SQUARE, CONFIG_KEY.VERTICAL
]

const DIMENSIONS = {
    [CONFIG_KEY.WIDE]: {x:0, y:0, width: 1280, height: 720},
    [CONFIG_KEY.SQUARE]: {x:0, y:0, width: 720, height: 720},
    [CONFIG_KEY.VERTICAL]: {x:0, y:0, width: 720, height: 1280}
}

const LABELS = {
    [CONFIG_KEY.WIDE]: '1280x720 (16:9)',
    [CONFIG_KEY.SQUARE]: '720x720 (1:1)',
    [CONFIG_KEY.VERTICAL]: '720x1280 (9:16)'
}

const UI_LABELS = {
    [CONFIG_KEY.WIDE]: 'Wide ',
    [CONFIG_KEY.SQUARE]: 'Square ',
    [CONFIG_KEY.VERTICAL]: 'Vertical '
}

const PARAM_KEYS = {
    [CONFIG_KEY.WIDE]: 'wide',
    [CONFIG_KEY.SQUARE]: 'square',
    [CONFIG_KEY.VERTICAL]: 'vertical'
}

const PARAM_TO_CONFIG = {
    'wide': CONFIG_KEY.WIDE,
    'square': CONFIG_KEY.SQUARE,
    'vertical': CONFIG_KEY.VERTICAL
}

module.exports = {
    CONFIG_KEY,
    DIMENSIONS,
    LABELS,
    PARAM_KEYS,
    UI_LABELS,
    ITEMS,
    PARAM_TO_CONFIG
}
