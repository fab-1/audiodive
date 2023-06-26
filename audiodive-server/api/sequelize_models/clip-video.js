const gcloud = require('../../config/gcloud').gcloud

module.exports = (sequelize, DataTypes) => {

    const ClipVideo = sequelize.define("ClipVideo", {
        videoUrl: {
            type: DataTypes.STRING,
            get() {
                const videoUrl = this.getDataValue('videoUrl')
                if (!videoUrl) return null
                const urlPrefix = videoUrl.includes(gcloud.basePath) ? '' : gcloud.basePath + gcloud.bucket
                return urlPrefix + videoUrl
            }
        },
        imageUrl: {
            type: DataTypes.STRING,
            get() {
                const imageUrl = this.getDataValue('imageUrl')
                if (!imageUrl) return null
                const urlPrefix = imageUrl.includes(gcloud.basePath) ? '' : gcloud.basePath + gcloud.bucket
                return urlPrefix + imageUrl
            }
        },
        gifUrl: {
            type: DataTypes.STRING,
            get() {
                const gifUrl = this.getDataValue('gifUrl')
                if (!gifUrl) return null
                return gcloud.basePath + gcloud.bucket + gifUrl
            }
        },
        previewUrl: {
            type: DataTypes.STRING,
            get() {

                if (!this.getDataValue('previewUrl')) return null

                const urlPrefix = this.getDataValue('previewUrl').includes(gcloud.basePath) ? '' : gcloud.basePath + gcloud.bucket
                return urlPrefix + this.getDataValue('previewUrl')
            }
        },
        name: DataTypes.STRING,
        ratio: DataTypes.STRING,
        ready: DataTypes.BOOLEAN,
        highlightId: DataTypes.STRING
    })

    ClipVideo.associate = models => {
        ClipVideo.belongsTo(models.Clip)
        ClipVideo.belongsTo(models.User)
        //ClipVideo.belongsTo(models.Creator)
    }

    return ClipVideo
}
