"use strict"
const gcloud = require('../../config/gcloud').gcloud

module.exports = function (sequelize, DataTypes) {

    const Feed = sequelize.define('Feed', {
        name: {
            type: DataTypes.STRING
        },
        image: {
            type: DataTypes.STRING
        },
        resizedImage: {
            type: DataTypes.STRING
        },
        playImage: {
            type: DataTypes.STRING
        },
        messengerImage: {
            type: DataTypes.STRING
        },
        metaData: {
            type: DataTypes.JSON
        },
        itunesUrl: {
            type: DataTypes.STRING
        },
        website: {
            type: DataTypes.STRING
        },
        jsonUrl: {
            type: DataTypes.STRING,
            get() {
                return this.getDataValue('jsonUrl') ? gcloud.basePath + gcloud.bucket + this.getDataValue('jsonUrl') : null
            }
        },
        rssFeedUrl: {
            type: DataTypes.STRING
        },
        autoRefresh: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        autoSend: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        autoImportWeblinks: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    })

    Feed.associate = (models) => {
        //Feed.belongsTo(models.Creator);
        Feed.hasMany(models.Podcast, {
            onDelete: 'CASCADE'
        })

        Feed.hasMany(models.UserPodcast)
        //Feed.belongsToMany(models.Personality, { through: models.PodcastHosts });
    }

    return Feed
}
