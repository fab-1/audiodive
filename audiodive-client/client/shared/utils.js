import textFit from '../libs/textFit'
import {delay} from 'lodash'
import fitty from 'fitty'

export class Utils {
    static getStyles(config) {

        const PIXEL_PROPERTIES = [
            'left', 'top', 'width', 'height', 'fontSize',
            'paddingTop', 'paddingRight', 'paddingLeft', 'paddingBottom', 'borderRadius',
            'borderWidth', 'borderBottomLeftRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius', 'borderBottomLeftRadius']

        const styles = {}

        Object.keys(config).forEach(key => {

            let value = config[key]

            if (key === 'x' && !config['left'])
                key = 'left'

            if (key === 'y' && !config['left'])
                key = 'top'

            if (key === 'angle' && parseInt(value) !== 0) {
                key     = 'transform'
                value   = `rotate(${value}deg)`
                styles.transformOrigin = 'left top'
            }

            if (PIXEL_PROPERTIES.indexOf(key) !== -1) {
                value = `${value}px`
            }
            else if (key === 'fontFamily') {
                value = `'${value}', Arial`
            }

            styles[key] = value
        })

        if (config.textShadowOffsetX || config.textShadowOffsetY) {
            const {textShadowOffsetX, textShadowOffsetY, textShadowBlur = 0, textShadowColor} = config
            styles.textShadow = `${textShadowOffsetX}px ${textShadowOffsetY}px ${textShadowBlur}px ${textShadowColor}`
        }

        if (styles.display === 'inline') {
            delete styles.width
        }

        if (config.backgroundImage) {
            styles.backgroundImage = `url(${config.backgroundImage})`
            styles.backgroundSize = 'cover'
        }

        if (config.verticalAlign && config.verticalAlign !== 'top') {
            const map = { 'left' : 'flex-start', 'center': 'center', 'right': 'flex-end'}
            styles.display = 'flex'
            styles.alignItems = config.verticalAlign
            styles.justifyContent = map[config.textAlign]
        }

        if (config.type === 'htmlText') {
            styles.whiteSpace = 'pre-line'
        }

        ['borderRight','borderLeft','borderTop','borderBottom'].forEach(borderProp => {
            if (styles[borderProp]) {
                styles[borderProp] = `${styles[borderProp]}px solid ${styles.borderColor || '#000'}`
            }

            if (styles.borderWidth) {
                delete styles.borderWidth
            }
        })

        return styles
    }

    static getPlaybackTime(input, hideHour) {

        const sec_num = parseInt(input, 10)

        let hours   = Math.floor(sec_num / 3600)
        let minutes = Math.floor((sec_num - (hours * 3600)) / 60)
        let seconds = sec_num - (hours * 3600) - (minutes * 60)

        if (hours   < 10) {hours   = "0" + hours}
        if (minutes < 10) {minutes = "0" + minutes}
        if (seconds < 10) {seconds = "0" + seconds}

        return `${hideHour?'':hours + ':'}${minutes}:${seconds}`
    }

    static getFrameNumberFromTime(ms) {
        return Math.floor(ms/25)
    }

    static async applyTextFit({textArea, config}) {
        const {blocksById, blockIds} = config
        console.time('textFit')
        const maxFontSize = parseInt(textArea.fontSize || 50) + 15
        const fitBlock = (blockId) => {
            const bEl = document.getElementById(blockId)
            if (bEl)
                textFit(bEl, { multiLine: true, maxFontSize })
        }

        blockIds.forEach((blockId, index) => {
            delay(fitBlock, index * 3, blockId)
        })
        console.timeEnd('textFit')
    }

    static async addWordsToTimeline({textArea, config, wordsTimeline, viewport, isFrame, containerSelector, noInitDelay, onlyShowBlocks}, noRefreshTextFit, wordIdsUpdated){

        const {mediasById, wordIds, wordsById, blocksById, blockIds} = config

        const getWordElem = wordId => {
            let elem = document.getElementById(`word_${wordId}`)
            if (!elem)
                elem = document.querySelector(`${containerSelector? containerSelector : ''} .${wordId}`)

            return elem
        }

        if (!isFrame && !wordIdsUpdated) wordsTimeline.clear()

        Object.entries(mediasById || {}).forEach(([mediaId, media]) => {

            const elem = document.getElementById('media_preview_' + mediaId)

            if (!elem) {
                return
            }

            //reset props
            elem.style.transform = 'none'
            elem.style.opacity = 1

            if (media.showTransition && media.showTransition.cssProperty !== 'none') {
                Utils.animateElement(elem, media.imageStyle, media.showTransition, viewport, true, wordsTimeline, Number(media.general.time), isFrame)
            }

            if (media.during && media.during.cssProperty !== 'none') {
                const {general} = media
                const duration = general.timing === 'endtime'? Number(general.endtime) - Number(general.time) : + Number(general.duration)
                media.during.duration = duration
                Utils.animateElement(elem, media.imageStyle, media.during, viewport, true, wordsTimeline, Number(general.time), isFrame)
            }

            if (media.hideTransition && media.hideTransition.cssProperty !== 'none') {

                const {time, duration, endtime, timing} = media.general
                const endTime = timing === 'endtime'? Number(endtime):Number(time) + Number(duration)

                Utils.animateElement(elem, media.imageStyle, media.hideTransition, viewport, false, wordsTimeline, endTime, isFrame)
            }
        })

        if (!textArea || !wordIds) {
            return
        }

        const maxFontSize = parseInt(textArea.fontSize || 50) + 15
        const fitBlock = (blockId) => {
            const bEl = document.getElementById(blockId)
            if (bEl)
                textFit(bEl, { multiLine: true, maxFontSize })
        }

        const setBlockInitialState = (blockId) => {

            const block = blocksById[blockId]
            const firstWordId = block.wordIds[0]
            const lastWordId = block.wordIds[block.wordIds.length-1]

            Utils.animateElement(document.getElementById(blockId), {}, {duration: 0.1}, {},  true, wordsTimeline, wordsById[firstWordId].start, isFrame)
            Utils.animateElement(document.getElementById(blockId), {}, {duration: 0.2}, {},  false, wordsTimeline, wordsById[lastWordId].end, isFrame)
        }


        const addBlockToTimeline = (blockId, index, customDelay) => {
            const timeDelay = customDelay || noInitDelay? 1 : 300

            return new Promise((resolve, reject) => {
                delay(() => {
                    const block = blocksById[blockId]
                    block.wordIds.forEach((wordId, index) => {

                        if (wordIdsUpdated && wordIdsUpdated.indexOf(wordId) === -1) {
                            return
                        }

                        const elem = getWordElem(wordId)
                        if (!elem) return

                        this.addWordToTimeline(wordId, index, elem, textArea, config, wordsTimeline, viewport, isFrame)
                    })

                    !noRefreshTextFit && fitBlock(blockId)

                    resolve()
                }, index * timeDelay)
            })
        }



        if (textArea.wordScrolling === 'none') {
            wordIds.forEach(wordId => {
                const elem = document.querySelector(`.${wordId}`)
                elem.removeAttribute('style')
            })

        }
        else {
            Promise.all(blockIds.map((blockId, index) => {
                setBlockInitialState(blockId)
                if (onlyShowBlocks && onlyShowBlocks.includes(blockId)) {
                    addBlockToTimeline(blockId, index, 1)
                }
                return addBlockToTimeline(blockId, index)
            }))
        }
    }

    static addWordToTimeline(wordId, index, elem, textArea, config, wordsTimeline, viewport, isFrame) {

        const {wordsById, blocksById} = config

        const word = wordsById[wordId]
        const block = blocksById[word.blockId]

        if (word.start === undefined) {
            elem.style.opacity = 0
            return
        }

        let cascadedConfig = Object.assign(
            {
                duration: 0.2
            },
            textArea,
            block.customStyles || {},
            word.customStyles || {}
        )

        if (cascadedConfig.wordScrolling) {
            cascadedConfig = Utils.convertToNewConfig(cascadedConfig)
        }

        const parent = elem.offsetParent
        const bounds = {
            top: parent.offsetTop + elem.offsetTop,
            left: parent.offsetLeft + elem.offsetLeft,
            height: elem.offsetHeight,
            width: elem.offsetWidth
        }

        //if we don't override the anim for this word, then we don't need to set the original state, for performance
        // const hasCustomBlockAnim = (block.customStyles && (block.customStyles.wordAnimation || block.wordScrolling))
        // const hasCustomWordAnim = (word.customStyles && (word.customStyles.wordAnimation || word.wordScrolling))
        // const noInitialSet = !hasCustomWordAnim && !hasCustomBlockAnim

        elem.style.opacity = 1

        Utils.animateElement(elem, bounds, cascadedConfig, viewport,  true, wordsTimeline, word.start, isFrame)

        if (cascadedConfig.wordScrolling === 'highlight' && cascadedConfig.resetColor) {
            Utils.animateElement(elem, {}, cascadedConfig, {},  false, wordsTimeline, word.end, isFrame)
        }


    }

    static getSpeakerRanges(config) {
        const {blocksById, wordsById, wordIds, blockIds} = config


        let speakerRange = []
        let currentRange = null

        // const sortedBlocks = blockIds.map(blockId => {
        //     let block = blocksById[blockId]
        //     const wordIds = block.wordIds
        //     block.start = wordsById[wordIds[0]].start
        //     block.end = wordsById[wordIds[wordIds.length - 1]].end
        //     return block
        // })

        if (!blockIds) return speakerRange

        blockIds.forEach(blockId => {

            const block = blocksById[blockId]
            const {speakerTag} = block
            const last = wordsById[block.wordIds[block.wordIds.length-1]]
            const first = wordsById[block.wordIds[0]]

            if (!currentRange || currentRange.speakerTag !== speakerTag) {

                //close this range
                if (currentRange) {
                    currentRange.end = first.start
                }

                currentRange = {
                    speakerTag,
                    start: first.start
                }
                speakerRange.push(currentRange)
            }
        })

        const lastWord = wordsById[wordIds[wordIds.length-1]]

        currentRange.end = lastWord.end

        //console.log(speakerRange)

        return speakerRange
    }

    static addTemplateToTimeline({templatesTimeline, config, viewport, layoutRange, speakerRange}) {
        templatesTimeline.clear()

        const templateElement = document.getElementById('template-camera')

        if (templateElement)
            templateElement.style.opacity = 1

        config.showTransition && Utils.animateElement(templateElement, viewport, config.showTransition, viewport, true,  templatesTimeline, layoutRange.start)
        config.hideTransition && Utils.animateElement(templateElement, viewport, config.hideTransition, viewport, false,  templatesTimeline, layoutRange.end - config.hideTransition.duration)

        //console.log(config)

        //console.log(layoutRange, speakerRange)

        config.canvas.objects.forEach((object, index, original) => {

            //we need to find the correct zIndex, however dynamic media should always be after text in editor

            const linkedElement = config.linkedElements[object.id]
            const fullElement = {
                ...linkedElement,
                id: object.id,
                type: object.type,
                top: object.top,
                left: object.left,
                width: Math.round(object.width * object.scaleX),
                height: Math.round(object.height * object.scaleY),
                angle: object.angle,
                src: linkedElement.src || object.src,
                zIndex: index + 1
            }

            const element = document.getElementById(object.id)
            if (!element) {
                console.log('missing element ', object.id , element, linkedElement)
                return
            }

            element.style.visibility = 'visible'


            const {hideTransition, showTransition} = linkedElement

            element.style.opacity = fullElement.opacity || 1

            if (showTransition) {


                if (linkedElement.speaker && speakerRange) {
                    speakerRange.forEach(range => {
                        if (range.speakerTag === linkedElement.speaker) {
                            Utils.animateElement(element, fullElement, showTransition, viewport, true,  templatesTimeline, range.start)
                        }
                    })
                }
                else {

                    let startTime = layoutRange.start
                    if (showTransition.delay) {
                        startTime = (showTransition.showEvent === 'beforeEnd'?
                                layoutRange.end - Number(showTransition.duration) - Number(showTransition.delay)
                                :
                                layoutRange.start + Number(showTransition.delay)
                        )
                    }

                    Utils.animateElement(element, fullElement, linkedElement.showTransition, viewport, true,  templatesTimeline, startTime)
                }

            }

            if (hideTransition) {

                if (linkedElement.speaker && speakerRange) {
                    speakerRange.forEach(range => {
                        if (range.speakerTag === linkedElement.speaker) {
                            Utils.animateElement(element, fullElement, hideTransition, viewport, false,  templatesTimeline, range.end - Number(hideTransition.duration))
                        }
                    })
                }
                else {
                    const startTime = hideTransition.hideEvent === 'beforeEnd'? layoutRange.end - Number(hideTransition.duration) : layoutRange.start + Number(hideTransition.offset)
                    Utils.animateElement(element, fullElement, hideTransition, viewport, false, templatesTimeline, startTime)
                }
            }
        })

    }

    static animateElement(elem, layerBounds, config = {}, container, isStart, timelineInstance, timeOffset, isFrame) {

        const effect = config.easing || config.effect || 'Sine'
        const easing = config.acceleration || config.type || config.wordEasing || 'easeOut'
        const prop = config.cssProperty || config.wordAnimation || 'opacity'

        //duration of the animation, could be second or frame
        let duration = Number(config.duration) || 0.3

        if (isFrame) {
            duration = this.getFrameNumberFromTime(duration * 1000)
        }

        let to = {
            ease: window[effect][easing]
        }

        let from = {}

        to.opacity = 1 //ensure opacity is alway set back to 1

        switch (prop) {
            case 'left':
                from.x = - layerBounds.left - layerBounds.width
                to.x = 0
                break

            case 'right':
                from.x = container.width
                to.x = 0
                break

            case 'up':
                from.y = - layerBounds.top - layerBounds.height
                to.y = 0
                break

            case 'down':
                from.y = container.height
                to.y = 0
                break

            case 'opacity':
                from.opacity = 0
                to.opacity = 1
                break

            case 'scale':
                if (config.originX) {

                    const left = config.originX - layerBounds.left
                    const top = config.originY - layerBounds.top

                    from.transformOrigin = `${left}px ${top}px`
                }

                from.scale = config.scale || 0
                to.scale = 1

                //edge case. If opacity is set to zero then it means some other animation was set so we need to avoid overriding the prvious animation
                if (elem.style.opacity === 0) {
                    delete to.opacity;
                }

                break

            case 'color':
                from.color = config.color
                to.color = config.highlightColor
                break
        }

        if (config.textAnim) {

            if (elem.childElementCount > 0) {
                const content = Array.from(elem.children).map(e => e.innerHTML).join(' ')
                elem.innerHTML = content
            }

            const mySplitText = new SplitText(elem)
            mySplitText.split({type:"words"})

            if (config.delay && isStart) {
                timeOffset += Number(config.delay)
            }

            let textFrom = {ease: to.ease}
            if (prop === 'left') textFrom.x = -300
            if (prop === 'up') textFrom.y = -300
            if (prop === 'right') textFrom.x = 300
            if (prop === 'down') textFrom.y = 300

            const multiplier = 0.1

            mySplitText.words.forEach((word, index) => {

                let start = timeOffset + index * multiplier
                if (isFrame) {
                    start = this.getFrameNumberFromTime(start * 1000)
                }

                timelineInstance.from(word, duration, {opacity:0, force3D:true}, start);

                // if we translate, we add this otherwise ignore.
                if (textFrom.x || textFrom.y) {
                    timelineInstance.from(word, duration, textFrom, start);
                }
            })

            return
        }

        //set initial state
        if (isStart && elem) {
            if (prop === 'opacity')
                elem.style.opacity = from.opacity
            else if (prop === 'color')
                elem.style.color = from.color
            else
                gsap.set(elem, from)
        }

        if (timelineInstance) {

            // if (config.delay && isStart) {
            //     timeOffset += Number(config.delay)
            // }

            if (isFrame) {
                timeOffset = this.getFrameNumberFromTime(timeOffset * 1000)
            }

            try {
                timelineInstance.to(elem, duration, isStart? to:from, timeOffset)
            }
            catch(e) {
                //debugger;
            }
        }
        else {

            if (config.delay) {
                to.delay = config.delay
            }

            if (!isStart) {
                from.onComplete = _ => TweenMax.set(elem, to)
            }

            gsap.to(elem, duration, isStart? to:from)
        }

    }

    static convertToNewConfig(oldConfig) {
        return {
            ...oldConfig,
            acceleration: oldConfig.wordEasing,
            effect: oldConfig.wordEffect,
            cssProperty: oldConfig.wordScrolling === 'highlight'? 'color':oldConfig.wordAnimation
        }
    }
}