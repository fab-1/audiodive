"use strict";

module.exports = function(sequelize, DataTypes) {

    const PodcastHosts = sequelize.define('PodcastHosts', {
        rank: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    });

    PodcastHosts.associate = (models) => {
        PodcastHosts.belongsTo(models.Feed);
        PodcastHosts.belongsTo(models.Personality);
    }

    return PodcastHosts;
};