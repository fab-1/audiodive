"use strict";

module.exports = function(sequelize, DataTypes) {

    const PodcastGuests = sequelize.define('PodcastGuests', {
        rank: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    });

    PodcastGuests.associate = (models) => {
        PodcastGuests.belongsTo(models.Podcast);
        PodcastGuests.belongsTo(models.Personality);
    }

    return PodcastGuests;
};