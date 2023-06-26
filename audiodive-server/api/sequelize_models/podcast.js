"use strict"

module.exports = function (sequelize, DataTypes) {

    const Podcast = sequelize.define('Podcast',
        {
            title: {
                type: DataTypes.STRING
            },
            description: {
                type: DataTypes.TEXT
            },
            date: {
                type: DataTypes.DATE
            },
            image: {
                type: DataTypes.STRING
            },
            shortTitle: {
                type: DataTypes.STRING
            },
            altImage: {
                type: DataTypes.STRING
            },
            playImage: {
                type: DataTypes.STRING
            },
            extraData: {
                type: DataTypes.TEXT
            },
            metaData: {
                type: DataTypes.JSON
            },
            links: {
                type: DataTypes.TEXT
            },
            audioUrl: {
                type: DataTypes.STRING
            },
            guid: {
                type: DataTypes.STRING
            },
            type: {
                type: DataTypes.ENUM('episode', 'teaser', 'patreon'), //note : teaser should be renamed clip
                allowNull: false,
                defaultValue: 'episode'
            },
            isTeaser: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        },
        {
            indexes: [
                {
                    name: 'feed_guid',
                    fields: ['FeedId', 'guid']
                }
            ]
        }
    )

    Podcast.associate = (models) => {
        Podcast.belongsTo(models.Feed)
        //Podcast.belongsTo(models.Creator); // we could get that from Feed, but I'd rather save a join
        Podcast.hasMany(models.Clip)
    }

    return Podcast
}
