"use strict";

module.exports = function(sequelize, DataTypes) {

    const PlaylistPodcast = sequelize.define('PlaylistPodcast', {
        rank: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    });

    PlaylistPodcast.associate = (models) => {
        PlaylistPodcast.belongsTo(models.Podcast);
        PlaylistPodcast.belongsTo(models.Playlist);
    }

    return PlaylistPodcast;
};