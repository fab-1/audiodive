const gcloud = require('../../config/gcloud').gcloud

module.exports = (sequelize, DataTypes) => {

    const Clip = sequelize.define('Clip', {
        name: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.TEXT
        },
        start: {
            type: DataTypes.FLOAT
        },
        end: {
            type: DataTypes.FLOAT
        },
        totalDuration: {
            type: DataTypes.INTEGER
        },
        ratio: {
            type: DataTypes.ENUM('configSquare', 'configVertical', 'configWide'),
            defaultValue: 'configSquare'
        },
        status: {
            type: DataTypes.ENUM('pending', 'processing', 'ready', 'cutting', 'transcribing'),
            defaultValue: 'pending'
        },
        audioUrl: {
            type: DataTypes.STRING,
            get() {

                if (!this.getDataValue('audioUrl')) return null

                const urlPrefix = this.getDataValue('audioUrl').includes('http') ? '' : gcloud.basePath + gcloud.bucket
                return urlPrefix + this.getDataValue('audioUrl')
            }
        },
        streamUrl: {
            type: DataTypes.STRING,
            get() {

                if (!this.getDataValue('streamUrl')) return null

                const urlPrefix = this.getDataValue('streamUrl').includes(gcloud.basePath) ? '' : gcloud.basePath + gcloud.bucket
                return urlPrefix + this.getDataValue('streamUrl')
            }
        },
        originalAudioUrl: {
            type: DataTypes.STRING
        },
        config: {
            type: DataTypes.JSON
        },
        metaData: {
            type: DataTypes.JSON
        },
        UserId: {
            type: DataTypes.INTEGER
        },
        scheduledAt: {
            type: DataTypes.DATE
        },
        isPremium: DataTypes.BOOLEAN,
        unlocked: DataTypes.BOOLEAN,
        isMusic: DataTypes.BOOLEAN
    }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    })

    Clip.associate = models => {
        Clip.belongsTo(models.Podcast)
        Clip.belongsTo(models.Feed)
        Clip.hasMany(models.ClipVideo)
        Clip.hasMany(models.UserClip, {
            // onDelete: 'CASCADE'
        })
        Clip.hasMany(models.UserSavedClip, {
            // onDelete: 'CASCADE'
        })
        Clip.belongsTo(models.Template)
    }

    return Clip
}

