import axios from 'axios'
import shortId from "shortid"
import kebabCase from "lodash/kebabCase"

export const RECEIVE_CLIP = 'RECEIVE_CLIP'
export function receiveClip(clip) {
    return {
        type: RECEIVE_CLIP,
        clip
    }
}



export const SAVED_CLIP = 'SAVED_CLIP'
function savedClip(clip) {
    return {
        type: SAVED_CLIP, clip
    }
}

export const IMPORT_TEXT = 'IMPORT_TEXT'
export function importText(text, pos) {
    return {
        type: IMPORT_TEXT,
        text,
        pos
    }
}


export const SAVING_CLIP = 'SAVING_CLIP'
function savingClip(clipId) {
    return {
        type: SAVING_CLIP, clipId
    }
}
export const FETCHING_CLIP = 'FETCHING_CLIP'
function fetchingClip(clipId) {
    return {
        type: FETCHING_CLIP, clipId
    }
}
export const RESET_CLIP = 'RESET_CLIP'
export function resetClip() {
    return {
        type: RESET_CLIP
    }
}

export const RESTORE_CLIP = 'RESTORE_CLIP'
export function restoreClip(clipId) {
    return {
        type: RESTORE_CLIP, clipId
    }
}

export const FETCH_CLIP = 'FETCH_CLIP'
export function fetchClip(clipId, isClone) {
    return (dispatch, getState) => {

        dispatch(fetchingClip(clipId))

        return axios.get(`/admin/api/clip/${clipId}`)
            .then(response => dispatch(receiveClip(response.data, isClone)))
    }
}


export const SAVE_CLIP = 'SAVE_CLIP'
export function saveClip(id) {
    return (dispatch, getState) => {

        dispatch(savingClip(id))

        const clipData = getState().clip.present
        const template = getState().template.present

        if (clipData.config.wordsById) {
            Object.values(clipData.config.wordsById).forEach(word =>{
                delete word.minLength
                delete word.drag
            });
        }

        const req = axios.put(`/admin/api/clip/${id}`, {
            ...clipData,
            template
        })

        req.then(response => dispatch(savedClip(response.data)))
        req.catch(e => dispatch(savedClip(clipData)))
        return req
    }
}


export const CAN_SHIFT_BLOCKS = 'CAN_SHIFT_BLOCKS'
export function canShiftWords(block, time, clipDuration) {
    return (dispatch, getState) => {

        const {
            clip: {
                present: {
                    config: {
                        wordIds,
                        wordsById
                    }
                }
            }
        } = getState()

        const firstWordId = block.wordIds[0]

        let canShift = true
        let startCounting = false
        wordIds.forEach((wordId, wordIndex) => {
            if (firstWordId === wordId) {
                startCounting = true
            }

            if (startCounting) {

                let timeOffset = wordsById[wordId].end + time - wordsById[firstWordId].start

                //if it's the last word, we allow for it to be resized as long as it does go shorter than .3 seconds (arbitrary value)
                if (wordIndex === wordIds.length - 1) {
                    timeOffset = wordsById[wordId].start + 0.3 + time - wordsById[firstWordId].start
                }


                if (timeOffset > clipDuration) {
                    console.log(timeOffset, clipDuration)
                    canShift = false

                }
            }
        })

        return canShift
    }
}


export function insertMode(time) {
    return (dispatch, getState) => {

        const {
            clip: {
                present: {
                    config: {
                        wordIds,
                        wordsById
                    }
                }
            }
        } = getState()

        if (!wordIds) return true

        for (let i = 0; i < wordIds.length; i++) {
            const word = wordsById[wordIds[i]]

            if (word.start < time && word.end > time) {
                return false
            }
        }

        return true
    }
}

export function canShiftBlock(blockId, time) {
    return (dispatch, getState) => {

        const {
            clip: {
                present: {
                    config: {
                        wordIds,
                        wordsById,
                        blocksById
                    }
                }
            }
        } = getState()

        if (!wordIds) return true

        for (let i = 0; i < wordIds.length; i++) {
            const word = wordsById[wordIds[i]]

            if (word.start < time && word.end > time) {
                return false
            }
        }

        return true
    }
}


export const PROCESS_CLIP = 'PROCESS_CLIP'
export function processClip(id, processConfig) {
    return (dispatch, getState) => {

        const req = axios.post(`/admin/api/clip/process/${id}`, {
            processConfig
        })

        return req
    }
}

export const UPDATE_CLIP = 'UPDATE_CLIP'
export function updateClip(values) {
    return {
        type: UPDATE_CLIP,
        values
    }
}

export const GET_TRANSCRIPT = 'GET_TRANSCRIPT'
export function getTranscript(id) {
    return (dispatch, getState) => {
        return axios.post(`/admin/api/clip/${id}/transcript`)
    }
}

export const CLIP_UPDATE_WORDS = 'CLIP_UPDATE_WORDS'
export function updateWords(wordList) {
    return {
        type: CLIP_UPDATE_WORDS,
        wordList
    }
}

export const UPDATE_WORD = 'UPDATE_WORD'
export function updateWord(wordId, values) {
    return {
        type: UPDATE_WORD,
        wordId,
        values
    }
}

export const CREATE_WORD = 'CREATE_WORD'
export function createWord(time, content = '') {
    return {
        type: CREATE_WORD,
        time,
        content
    }
}

export const DELETE_WORD = 'DELETE_WORD'
export function deleteWord(wordId) {
    return {
        type: DELETE_WORD,
        wordId
    }
}

export const SPLIT_WORD = 'SPLIT_WORD'
export function splitWord(wordId) {
    return {
        type: SPLIT_WORD,
        wordId
    }
}

export const SPLIT_BLOCK = 'SPLIT_BLOCK'
export function splitBlock(blockId, wordIndexInBlock) {
    return {
        type: SPLIT_BLOCK,
        blockId,
        wordIndexInBlock
    }
}

export const MERGE_BLOCK = 'MERGE_BLOCK'
export function mergeBlock(blockId) {
    return {
        type: MERGE_BLOCK,
        blockId
    }
}

export const ADD_BLOCK = 'ADD_BLOCK'
export function addBlock(startTime) {

    const newWordId = 'word_' + shortId.generate()

    return {
        type: ADD_BLOCK,
        startTime,
        newWordId
    }
}

export const UPDATE_BLOCK = 'UPDATE_BLOCK'
export function updateBlock(blockId, values) {
    return {
        type: UPDATE_BLOCK,
        blockId,
        values
    }
}

export const SHIFT_BLOCKS = 'SHIFT_BLOCKS'
export function shiftBlocks(blockId, time) {
    return {
        type: SHIFT_BLOCKS,
        blockId,
        time,
    }
}

export const DELETE_BLOCK = 'DELETE_BLOCK'
export function deleteBlock(blockId) {
    return {
        type: DELETE_BLOCK,
        blockId,
    }
}

export const CLONE_BLOCKS = 'CLONE_BLOCKS'
export function cloneBlock(blockId, time) {
    return {
        type: CLONE_BLOCKS,
        blockId,
        time,
    }
}

export const CREATE_MEDIA = 'CREATE_MEDIA'
export function createMedia(parameters) {
    parameters.id = `${kebabCase(parameters.name)}_${shortId.generate()}`
    return {
        type: CREATE_MEDIA,
        ...parameters
    }
}

export const UPDATE_MEDIA = 'UPDATE_MEDIA'
export function updateMedia(mediaId, values) {
    return {
        type: UPDATE_MEDIA,
        mediaId,
        values
    }
}


export const DELETE_MEDIA = 'DELETE_MEDIA'
export function deleteMedia(mediaId) {
    return {
        type: DELETE_MEDIA,
        mediaId
    }
}

export const CLONE_MEDIA = 'CLONE_MEDIA'
export function cloneMedia(mediaId, startTime) {
    return {
        type: CLONE_MEDIA,
        mediaId,
        startTime
    }
}


export const UPDATE_GLOBAL = 'UPDATE_GLOBAL'
export function updateGlobal(values) {
    return {
        type: UPDATE_GLOBAL,
        values
    }
}

export const UNDO_CLIP = 'UNDO_CLIP'
export function undoClip(values) {
    return {
        type: UNDO_CLIP
    }
}
export const REDO_CLIP = 'REDO_CLIP'
export function redoClip(values) {
    return {
        type: REDO_CLIP
    }
}

export const CLIP_EDIT_ACTIONS = [UPDATE_GLOBAL, DELETE_MEDIA, UPDATE_MEDIA, CREATE_MEDIA,
    UPDATE_BLOCK, MERGE_BLOCK, SPLIT_BLOCK, DELETE_WORD, CREATE_WORD,
    CLIP_UPDATE_WORDS]

export const ALL_CLIP_ACTIONS = [UPDATE_GLOBAL, DELETE_MEDIA, UPDATE_MEDIA, CREATE_MEDIA,
                            UPDATE_BLOCK, MERGE_BLOCK, SPLIT_BLOCK, DELETE_WORD, CREATE_WORD,
                            CLIP_UPDATE_WORDS, UPDATE_CLIP, SAVE_CLIP, FETCH_CLIP, SAVING_CLIP, SAVED_CLIP, RECEIVE_CLIP]