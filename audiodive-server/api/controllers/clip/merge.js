
const models = sails.hooks.sequelize.models

module.exports = async function get(req, res) {


    const final = await models.Clip.findByPk(908)
    const clipRecord = await models.Clip.findByPk(906)
    const clipToAdd = await models.Clip.findByPk(899)

    const offset = 64.5

    const config = clipRecord.toJSON().config

    const conf2 = clipToAdd.toJSON().config


    const {blocksById, blockIds, wordsById} = conf2
    blockIds.forEach(blockId => {
        let block = blocksById[blockId]
        const newWordIds = block.wordIds.map(wordId => {
            const wordToAdd = wordsById[wordId]
            const newWordId = 'new_' + wordId
            wordToAdd.id = newWordId
            wordToAdd.start = wordToAdd.start + offset
            wordToAdd.end = wordToAdd.end + offset

            config.wordsById[newWordId] = wordToAdd
            config.wordIds.push(newWordId)

            return newWordId
        })

        block.wordIds = newWordIds

        config.blocksById[blockId] = block
        config.blockIds.push(blockId)
    })

    config.mediasById = conf2.mediasById
    config.fftData = final.config.fftData

    final.update({
        config
    })

    res.json({})
}
