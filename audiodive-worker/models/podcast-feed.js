"use strict";

module.exports = function(sequelize, DataTypes) {

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
        itunesUrl:  {
            type: DataTypes.STRING
        },
        googleUrl:  {
            type: DataTypes.STRING
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
    });

    Feed.associate = (models) => {
        Feed.belongsTo(models.Creator);
        Feed.hasMany(models.Podcast, {
            scope: [{
                type: {$ne: 'teaser'}
            }],
            onDelete: 'CASCADE'
        });
        Feed.belongsToMany(models.Personality, { through: models.PodcastHosts });
    }

    return Feed;
};