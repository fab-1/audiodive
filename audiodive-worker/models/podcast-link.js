"use strict";

module.exports = function(sequelize, DataTypes) {

    const PodcastLinks = sequelize.define('PodcastLinks', {
        rank: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        start: {
            type: DataTypes.INTEGER
        },
        end: {
            type: DataTypes.INTEGER
        }
    });

    PodcastLinks.associate = (models) => {
        PodcastLinks.belongsTo(models.Creator);
        PodcastLinks.belongsTo(models.Podcast);
        PodcastLinks.belongsTo(models.Podcast, {
            as: 'AudioClip'
        });
        PodcastLinks.belongsTo(models.Link);
        PodcastLinks.belongsTo(models.Personality);
    }

    return PodcastLinks;
};