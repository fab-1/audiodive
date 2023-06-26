import update from 'immutability-helper';
import {
    RECEIVE_CLIP, UPDATE_CLIP, UPDATE_WORD,
    CLIP_UPDATE_WORDS, CREATE_WORD, DELETE_WORD,
    SPLIT_BLOCK, MERGE_BLOCK, UPDATE_BLOCK, CLONE_MEDIA, DELETE_BLOCK,
    CREATE_MEDIA, UPDATE_MEDIA, DELETE_MEDIA, SAVING_CLIP, ADD_BLOCK, CLONE_BLOCKS,
    UPDATE_GLOBAL, SPLIT_WORD, RESET_CLIP, IMPORT_TEXT, SAVED_CLIP, RESTORE_CLIP, CLIP_EDIT_ACTIONS, SHIFT_BLOCKS
} from '../actions/clip-actions'
import { ActionTypes } from 'redux-undo'
import findIndex from "lodash/findIndex"
import shortId from "shortid"
import kebabCase from "lodash/kebabCase"
import chunk from "lodash/chunk"
import throttle from "lodash/throttle"

//very dumb and not optimized unique id generator, and that's ok!
const generateId = (index, words) => {
    let counter = 0;
    let newId = `word_${index}`;
    while (words.indexOf(newId) !== -1) {
        newId = `word_${index}_${counter++}`;
    }
    return newId;
};

const getSortedWordIds = (wordsById) => {
    const wordEntries = Object.entries(wordsById)
    wordEntries.sort((entry1, entry2) => {
        return entry1[1].start - entry2[1].start
    })
    return wordEntries.map(entry => entry[0])
}

const getSortedBlockIds = (blocksById, wordsById) => {
    const blockEntries = Object.entries(blocksById)
    blockEntries.sort((entry1, entry2) => {
        const block1 = entry1[1]
        const block2 = entry2[1]
        return wordsById[block1.wordIds[0]].start - wordsById[block2.wordIds[0]].start
    })
    return blockEntries.map(entry => entry[0])
}

const createWordBlock = (param = {}) => {
    const NEW_BLOCK_ID = param.blockId || 'block_' + shortId.generate()
    const NEW_WORD_ID = param.wordId ||  'word_' + shortId.generate()

    const start = param.start
    const end = param.end || start + 1

    const newWord = {
        word: '',
        id: NEW_WORD_ID,
        blockId: NEW_BLOCK_ID,
        start,
        end,
        startMs: start * 1000,
        endMs: end * 1000
    }

    const newBlock = {
        id: NEW_BLOCK_ID,
        wordIds: [NEW_WORD_ID]
    }

    return {newWord, newBlock}
}

const WordApi = {

    getWordUpdates: (values, currentWord) => {
        let ret = {}

        for (let key in values) {
            let value = values[key]

            //special case: start or end time, we sanitize the values
            if (key === 'start' || key === 'end') {
                const msTime = Math.round(value * 1000)
                ret[`${key}Ms`] = {$set: msTime}
                ret[key] = {$set: msTime / 1000}
            }
            else if (value && typeof value === 'object' && currentWord[key]) {  //special case: if value is an object (for custom styles)
                let newVal = {};
                Object.keys(value).forEach(prop => {
                    newVal[prop] = {$set: value[prop]}
                })
                ret[key] = newVal
            }
            else {
                console.log('here', key)
                ret[key] = {$set: value}
            }
        }

        return ret
    },

    updateWords: (state, action) => {
        let updated = {
            wordsById: {}
        }

        Object.keys(action.wordList).forEach(wordId => {
            let word = action.wordList[wordId]
            updated.wordsById[wordId] = WordApi.getWordUpdates(word, state.config.wordsById[wordId])
        })

        return update(state, {
            config: updated
        })
    },

    updateWord: (state, action) => {
        let updated = {
            wordsById: {}
        }

        updated.wordsById[action.wordId] = WordApi.getWordUpdates(action.values, state.config.wordsById[action.wordId])

        return update(state, {
            config: updated
        })
    },

    splitWord: (state, action) => {

        const word = state.config.wordsById[action.wordId]
        const words = word.word.split(' ')
        const currentBlock = state.config.blocksById[word.blockId]
        const indexOfCurrentWordInBlock = currentBlock.wordIds.indexOf(word.id)

        if (words.length < 2) {
            return state
        }

        const oldWordDuration = word.end - word.start
        const newWordsDuration = oldWordDuration / words.length

        const wordUpdates = {}
        const blockWordsUpdate = [indexOfCurrentWordInBlock + 1, 0]

        const createWord = (start, end, content) => {
            return {
                start: start,
                startMs: start * 1000,
                end: end,
                endMs: end * 1000,
                word: content,
                id: 'word_' + shortId.generate(),
                blockId: word.blockId
            }
        }

        words.forEach((wordContent, index) => {

            const start = word.start + (newWordsDuration * index)
            const end = word.start + (newWordsDuration * (index + 1))

            switch (index) {
                case 0:
                    wordUpdates[word.id] = {
                        end: {$set: end},
                        word: {$set: wordContent}
                    }
                    break

                case words.length - 1:
                    const lastWord = createWord(start, word.end, wordContent)
                    wordUpdates[lastWord.id] = {$set: lastWord}
                    blockWordsUpdate.push(lastWord.id)
                    break

                default:
                    const middleWord = createWord(start, end, wordContent)
                    wordUpdates[middleWord.id] = {$set: middleWord}
                    blockWordsUpdate.push(middleWord.id)
                    break
            }
        })

        const updated = update(state, {
            config: {
                wordsById: wordUpdates,
                blocksById: {
                    [currentBlock.id]: {
                        wordIds: {$splice: [blockWordsUpdate]}
                    }
                }
            }
        })

        //update sorted ids
        updated.config.wordIds = getSortedWordIds(updated.config.wordsById)

        return updated
    },

    createWord: (state, action) => {
        let word = null
        for (let index = 0; index < state.config.wordIds.length; index++) {
            word = state.config.wordsById[state.config.wordIds[index]]

            if (word.end > action.time) {

                const start = parseFloat(action.time.toFixed(3))
                const newWord = {
                    start: start,
                    end: word.end,
                    word: action.content,
                    id: generateId(index, state.config.wordIds),
                    blockId: word.blockId
                }

                const currentBlock = state.config.blocksById[word.blockId]
                const indexOfCurrentWordInBlock = currentBlock.wordIds.indexOf(word.id);

                const updated = update(state, {
                    config: {
                        wordsById: {
                            [newWord.id]: {$set: newWord},
                            [word.id]: WordApi.getWordUpdates({end: action.time})
                        },
                        blocksById: {
                            [currentBlock.id]: {
                                wordIds: {$splice: [[indexOfCurrentWordInBlock + 1, 0, newWord.id]]}
                            }
                        }
                    }
                })

                updated.config.wordIds = getSortedWordIds(updated.config.wordsById)

                return updated
            }
        }
    },


    deleteWord: (state, action) => {

        const word = state.config.wordsById[action.wordId]
        const block = state.config.blocksById[word.blockId]

        const wordIndex = state.config.wordIds.indexOf(word.id)
        const blockIndex = state.config.blockIds.indexOf(block.id)
        const wordInBlockIndex = block.wordIds.indexOf(word.id)

        const previousWordIndex = wordIndex - 1;
        const previousWord = state.config.wordsById[state.config.wordIds[previousWordIndex]]


        let updates = {
            config: {
                wordsById: {
                    $unset: [word.id]
                },
                blockIds: (block.wordIds.length === 1 ? {$splice: [[blockIndex, 1]]} : {}),
                blocksById: {
                    [block.id]: {wordIds: {$splice: [[wordInBlockIndex, 1]]}}
                }
            }
        }

        if (previousWord) {
            updates.config.wordsById[previousWord.id] = {end: {$set: word.end}}
        }

        const updated = update(state, updates)

        updated.config.wordIds = getSortedWordIds(updated.config.wordsById)

        return updated
    }
}

const BlockApi = {
    mergeBlock: (state, action) => {

        const oldBlock = state.config.blocksById[action.blockId];

        const blockIndex = state.config.blockIds.indexOf(action.blockId)
        const previousIndex = blockIndex - 1

        if (blockIndex == 0){
            return state;
        }

        const updatedBlock = {...state.config.blocksById[state.config.blockIds[previousIndex]]}
        updatedBlock.wordIds = updatedBlock.wordIds.concat(oldBlock.wordIds)

        let wordsUpdates = {}
        oldBlock.wordIds.forEach(wordId => {
            wordsUpdates[wordId] = {blockId: {$set: updatedBlock.id}}
        })

        return update(state, {
            config: {
                blockIds: {$splice: [[blockIndex, 1]]},
                blocksById: {
                    [updatedBlock.id]: {$set: updatedBlock}
                },
                wordsById: wordsUpdates
            }
        })
    },

    splitBlock: (state, action) => {

        const blockIndex = state.config.blockIds.indexOf(action.blockId)

        const oldBlock = JSON.parse(JSON.stringify(state.config.blocksById[action.blockId]))

        const oldId = oldBlock.id
        //update old block (need to update id so that react can update accordingly
        const removed = oldBlock.wordIds.splice(action.wordIndexInBlock)
        oldBlock.id = shortId.generate()


        const newBlock = {
            wordIds: removed,
            id: shortId.generate()
        }

        let wordsUpdates = {}
        newBlock.wordIds.forEach(wordId => {
            wordsUpdates[wordId] = {blockId: {$set: newBlock.id}}
        })
        oldBlock.wordIds.forEach(wordId => {
            wordsUpdates[wordId] = {blockId: {$set: oldBlock.id}}
        })

        const newState = update(state, {
            config: {
                blockIds: {$splice: [[blockIndex, 1, oldBlock.id, newBlock.id]]},
                blocksById: {
                    [newBlock.id]: {$set: newBlock},
                    [oldBlock.id]: {$set: oldBlock}
                },
                wordsById: wordsUpdates
            }
        })

        delete newState.config.blocksById[oldId]

        return newState
    },

    addBlock: (state, action) => {

        const {wordIds, wordsById} = state.config


        const {newWord, newBlock} = createWordBlock({
            wordId: action.newWordId,
            start: action.startTime
        })


        let updates

        //CASE 1: there are words existing
        if (wordIds && wordIds.length) {

            let prevWord
            for (let i = wordIds.length - 1; i >= 0; i--) {
                prevWord = wordsById[wordIds[i]]

                if (prevWord.end < action.startTime) {
                    break
                }
            }

            updates = {
                config: {
                    blocksById: {[newBlock.id] : {$set: newBlock}},
                    wordsById:  {[newWord.id]: {$set:newWord}}
                }
            }

            //not enough room worth creating a new word
            if (newWord.start - prevWord.end < 0.3) {
                updates.config.wordsById[prevWord.id] = WordApi.getWordUpdates({end: newWord.start})
            }
            //enough room. We create an empty word to hold space between the two block
            else {
                const {newWord: emptyWord, newBlock: emptyBlock} = createWordBlock({
                    start: prevWord.end,
                    end: newWord.start
                })

                updates.config.wordsById[emptyWord.id] = {$set: emptyWord}
                updates.config.blocksById[emptyBlock.id] = {$set: emptyBlock}
            }


        }
        //CASE 2: no existing words
        else {
            updates = {
                config: {
                    blocksById: {$set: {[newBlock.id]: newBlock}},
                    wordsById: {$set: {[newWord.id]: newWord}}
                }
            }
        }

        const updated = update(state,  updates)

        updated.config.wordIds = getSortedWordIds(updated.config.wordsById)
        updated.config.blockIds = getSortedBlockIds(updated.config.blocksById, updated.config.wordsById)

        return updated
    },

    updateBlock: (state, action) => {

        const block = state.config.blocksById[action.blockId]
        let updateValues = {}
        for (let key in action.values) {
            let value = action.values[key]

            //special case: if value is an object (for custom styles)
            if (value && typeof value == 'object' && block[key]) {
                let newVal = {};
                Object.keys(value).forEach(key => {
                    newVal[key] = {$set: value[key]}
                })
                updateValues[key] = newVal
                break
            }

            updateValues[key] = {$set: value}
        }

        return update(state, {
            config: {blocksById: {[block.id]: updateValues}}
        })
    },

    cloneBlock: (state, action) => {
        const {blockId, time} = action
        const {blockIds, blocksById, wordsById} = state.config

        const offSetMS = time * 1000

        const blockToClone = blocksById[blockId]

        const clonedBlock = {
            id: 'block_' + shortId.generate(),
            wordIds: []
        }

        const {wordIds} = blockToClone
        const firstWord = wordsById[wordIds[0]]

        let updates = {
            config: {
                blocksById: {},
                wordsById:  {}
            }
        }

        wordIds.forEach(wordId => {

            const word = wordsById[wordId]
            const startMs = offSetMS + word.startMs - firstWord.startMs
            const endMs = offSetMS + word.endMs - firstWord.startMs

            const clonedWord = {
                id:  'word_' + shortId.generate(),
                blockId: clonedBlock.id,
                startMs,
                endMs,
                start: startMs / 1000,
                end: endMs / 1000,
                word: word.word
            }

            updates.config.wordsById[clonedWord.id] = {$set: clonedWord}

            clonedBlock.wordIds.push(clonedWord.id)
        })

        updates.config.blocksById[clonedBlock.id] = {$set: clonedBlock}

        const updated = update(state,  updates)

        updated.config.wordIds = getSortedWordIds(updated.config.wordsById)
        updated.config.blockIds = getSortedBlockIds(updated.config.blocksById, updated.config.wordsById)

        return updated
    },

    deleteBlock:  (state, action) => {
        const {blockId} = action
        const {blockIds, blocksById, wordsById} = state.config

        const blockToDelete = blocksById[blockId]

        const {wordIds} = blockToDelete

        let updates = {
            config: {
                blocksById: {$unset: [blockId]},
                wordsById:  {$unset: wordIds}
            }
        }

        const updated = update(state,  updates)

        updated.config.wordIds = getSortedWordIds(updated.config.wordsById)
        updated.config.blockIds = getSortedBlockIds(updated.config.blocksById, updated.config.wordsById)

        return updated
    },

    shiftBlocks: (state, action) => {
        const {blockId, time} = action
        const {blockIds, blocksById, wordsById, wordIds} = state.config

        const offSetMS = time * 1000

        let updated = {
            wordsById: {}
        }

        const firstBlockToShift = blocksById[blockId]
        const firstWordIdToShift = firstBlockToShift.wordIds[0]
        const firstWordStartMS = wordsById[firstWordIdToShift].start * 1000


        let shifting = false
        let firstWordIndex
        wordIds.forEach((wordId, wordIndex) => {
            if (firstWordIdToShift === wordId) {
                shifting = true
            }

            if (shifting) {
                const currentWord = wordsById[wordId]
                const startMS = Math.round(currentWord.start * 1000) + offSetMS - firstWordStartMS
                const endMS = Math.round(currentWord.end * 1000) + offSetMS - firstWordStartMS
                updated.wordsById[currentWord.id] = WordApi.getWordUpdates({
                    start: startMS / 1000,
                    end: endMS / 1000
                }, currentWord)

                //If there is a word before, and we are looking at the first word to shift, need to align the previous word
                if (wordIndex && firstWordIdToShift === wordId) {
                    const previousWord = wordsById[wordIds[wordIndex - 1]]

                    updated.wordsById[previousWord.id] = WordApi.getWordUpdates({
                        end: startMS / 1000
                    }, previousWord)
                }
            }
        })

        //
        // for (let i = 0; i < blockIds.length; i++) {
        //     const currentBlockId = blockIds[i]
        //     const previousBlock = i ? blocksById[blockIds[i - 1]] : null
        //     const currentBlock = blocksById[currentBlockId]
        //     const {wordIds} = currentBlock
        //
        //     if (blockIds[i] === currentBlockId) {
        //         shouldShift = true
        //         firstWordStartMS = Math.round(wordsById[wordIds[0]].start * 1000)
        //     }
        //
        //     if (shouldShift) {
        //
        //         for (let i = 0; i < wordIds.length; i++) {
        //             const currentWord = wordsById[wordIds[i]]
        //             const startMS = Math.round(currentWord.start * 1000) + offSetMS - firstWordStartMS
        //             const endMS = Math.round(currentWord.end * 1000) + offSetMS - firstWordStartMS
        //             updated.wordsById[currentWord.id] = WordApi.getWordUpdates({
        //                 start: startMS / 1000,
        //                 end: endMS / 1000
        //             }, currentWord)
        //         }
        //     }
        // }

        return update(state, {
            config: updated
        })
    }
}

const MediaApi = {
    createMedia: (state, action) => {

        const {imageStyle} = action

        const newMedia = {
            id: action.id,
            name: action.name,
            url: action.url,
            general: {
                time: action.pos,
                duration: 3,
                timing: 'duration',
                endtime: parseInt(action.pos, 10) + 5
            },
            imageStyle,
            showTransition : {
                cssProperty: 'opacity',
                easing: 'Sine',
                acceleration: 'easeOut',
                scale: 1,
                duration: 0.6
            },
            hideTransition : {
                cssProperty: 'opacity',
                easing: 'Sine',
                acceleration: 'easeIn',
                scale: 1,
                duration: 0.6
            },
            during : {
                cssProperty: 'none',
                easing: 'Linear',
                acceleration: 'easeIn',
                scale: 1,
                originX: Math.round(imageStyle.width/2),
                originY: Math.round(imageStyle.height/2),
            }
        }

        if (newMedia.url.indexOf('.gif') > -1) {
            newMedia.gifSettings = {
                loop:true,
                speed: 4
            }
        }

        return update(state, {
            config: {mediasById: {[newMedia.id]: {$set: newMedia}}}
        })
    },

    updateMedia: (state, action) => {

        const media = state.config.mediasById[action.mediaId]

        let updateValues = {}
        for (let key in action.values) {
            let value = action.values[key]

            //special case: if value is an object (for custom styles)
            if (typeof value === 'object' && media[key]) {
                let newVal = {};
                Object.keys(value).forEach(key => {
                    newVal[key] = {$set: value[key]}
                })
                updateValues[key] = newVal
            }
            else {
                updateValues[key] = {$set: value}
            }

        }

        return update(state, {
            config: {mediasById: {[media.id]: updateValues}}
        })

    },

    deleteMedia: (state, action) => {
        return update(state, {
            config: {mediasById: {$unset: [action.mediaId]}}
        })
    },


    cloneMedia: (state, action) => {

        const clonedMedia = state.config.mediasById[action.mediaId]
        const newMedia = JSON.parse(JSON.stringify(clonedMedia))

        newMedia.id = `${kebabCase(newMedia.name)}_${shortId.generate()}`
        newMedia.general.time = action.startTime

        return update(state, {
            config: {mediasById: {[newMedia.id]: {$set: newMedia}}}
        })
    }
}

const ClipApi = {
    updateGlobal: (state, action) => {
        let updateValues = {}
        for (let key in action.values) {
            let value = action.values[key]
            updateValues[key] = {$set: value}
        }
        return update(state, {
            config: { globalSettings: updateValues}
        })
    },

    updateClip: (state, action) => {
        let updateValues = {}
        for (let key in action.values) {
            let value = action.values[key]
            updateValues[key] = {$set: value}
        }

        return update(state, updateValues)
    },

    importText: (state, action) => {

        let newConfig = {
            wordsById: {},
            blocksById: {},
            //mediasById: {},
            blockIds: [],
            wordIds: [],
        }


        let wordIndex = 0
        const pos = action.pos || 0
        let previousWordEnd = pos
        const blocks = action.text.split('\n').map(block => block.trim())
        blocks.forEach((block, blockIndex) => {



            const blockId = `block_${blockIndex}`
            const newBlock = {
                id: blockId,
                wordIds:[],
                speakerTag: ''
            }

            const words = block.split(' ')

            words.forEach((word) => {


                const id = `word_${wordIndex}`
                const start = previousWordEnd
                const end = start + (word.length * 0.15)
                previousWordEnd = end

                newConfig.wordsById[id] = {
                    id,
                    word,
                    start,
                    end,
                    blockId
                }

                newBlock.wordIds.push(id)
                newConfig.wordIds.push(id)

                wordIndex++
            })

            newConfig.blockIds.push(blockId)
            newConfig.blocksById[blockId] = newBlock
        })

        return update(state, {
            config: {
                wordsById: { $set: newConfig.wordsById },
                blocksById: { $set: newConfig.blocksById },
                //mediasById: { $set: newConfig.wordsById },
                blockIds: { $set: newConfig.blockIds },
                wordIds: { $set: newConfig.wordIds },
            }
        })
    }


}

const getClipKey = id => `clip_${id}`

const saveState = throttle((state) => {
    try {
        state.localSaved = new Date()
        const serializedState = JSON.stringify(state);
        localStorage.setItem(getClipKey(state.id), serializedState);
        console.log('local saved')
    } catch {
        // ignore write errors
    }
}, 1000)

const clearState = () => {
    try {
        localStorage.setItem('clip_' + state.id, null);
    } catch {
        // ignore write errors
    }
}


const loadState = (id) => {
    try {
        const serializedState = localStorage.getItem(getClipKey(id));
        if (serializedState === null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch (err) {
        return undefined;
    }
}


const reducer = (state, action) => {

    //only save local state when an editing action was dispatched
    if (CLIP_EDIT_ACTIONS.includes(action.type)) {
        saveState(state)
    }

    switch (action.type) {

        case CLIP_UPDATE_WORDS:
            state.touched = true
            return WordApi.updateWords(state, action)

        case CREATE_WORD:
            state.touched = true
            return WordApi.createWord(state, action)

        case UPDATE_WORD:
            state.touched = true
            return WordApi.updateWord(state, action)

        case DELETE_WORD:
            state.touched = true
            return WordApi.deleteWord(state, action)

        case SPLIT_WORD:
            state.touched = true
            return WordApi.splitWord(state, action)

        case SPLIT_BLOCK:
            state.touched = true
            return BlockApi.splitBlock(state, action)

        case MERGE_BLOCK:
            state.touched = true
            return BlockApi.mergeBlock(state, action)

        case UPDATE_BLOCK:
            state.touched = true
            return BlockApi.updateBlock(state, action)

        case SHIFT_BLOCKS:
            state.touched = true
            return BlockApi.shiftBlocks(state, action)

        case CLONE_BLOCKS:
            state.touched = true
            return BlockApi.cloneBlock(state, action)

        case ADD_BLOCK:
            state.touched = true
            return BlockApi.addBlock(state, action)

        case DELETE_BLOCK:
            state.touched = true
            return BlockApi.deleteBlock(state, action)

        case CREATE_MEDIA:
            state.touched = true
            return MediaApi.createMedia(state, action)

        case UPDATE_MEDIA:
            state.touched = true
            return MediaApi.updateMedia(state, action)

        case DELETE_MEDIA:
            state.touched = true
            return MediaApi.deleteMedia(state, action)

        case CLONE_MEDIA:
            state.touched = true
            return MediaApi.cloneMedia(state, action)

        case UPDATE_GLOBAL:
            state.touched = true
            return ClipApi.updateGlobal(state, action)

        case UPDATE_CLIP:
            state.touched = true
            return ClipApi.updateClip(state, action)

        case RESET_CLIP:
            return null

        case SAVED_CLIP:
            const savedClip = action.clip.clip

            if (savedClip.TemplateId !== state.TemplateId) {
                state.TemplateId = savedClip.TemplateId
            }

            state.unlocked = savedClip.unlocked

            state.touched = false
            return state

        case IMPORT_TEXT:
            state.touched = true
            return ClipApi.importText(state, action)

        case RESTORE_CLIP:
            const {clipId} = action
            const newState = loadState(clipId)
            if (newState) {
                state = newState
            }
            return state

        case RECEIVE_CLIP:

            const {clip} = action

            if (clip === null)
                return clip

            let clipData = clip

            if (clipData.end)
                clipData.totalDuration = Math.round(clipData.end - clipData.start)

            if (!clip.config) return clipData

            const {blocksById, wordsById, wordIds} = clip.config

            if (!clipData.config.globalSettings) {
                clipData.config.globalSettings = {}
            }

            if (!clipData.config.mediasById) {
                clipData.config.mediasById = {}
            }

            if (!clipData.TemplateId) {
                clipData.TemplateId = clipData.config.globalSettings.layoutId
            }

            clipData.touched = false

            if (!wordsById) {


                // clipData.config.wordsById = {
                //     'blank': {
                //         word:'',
                //
                //     }
                // }


                return clipData
            }


            //Sorted words
            if (!wordIds)
                clipData.config.wordIds = getSortedWordIds(wordsById)

            let blockIds = clipData.config.blockIds
            let newBlocksById = Object.assign({}, blocksById)

            // clipData.config.wordIds.forEach(wordId => {
            //     const word = wordsById[wordId]
            //     if (!blockIds.includes(word.blockId)) {
            //         blockIds.push(word.blockId)
            //     }
            // })

            //clean up old blocks
            Object.keys(newBlocksById).forEach(blockId => {

                if (!newBlocksById[blockId].speakerTag) {
                    newBlocksById[blockId].speakerTag = '1'
                }

                if (!blockIds.includes(blockId)) {
                    delete newBlocksById[blockId]
                }

            })

            clipData.config.blockIds = blockIds
            clipData.config.blocksById = newBlocksById

            return clipData

        default:
            if (state === undefined)
                return null

            return state
    }
}

export default reducer