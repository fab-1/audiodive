"use strict";

module.exports = function(sequelize, DataTypes) {

    const Playlist = sequelize.define('Playlist', {
        name: {
            type: DataTypes.STRING
        },
        image: {
            type: DataTypes.STRING
        },
        rank: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        description : {
            type: DataTypes.STRING
        }
    }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    });

    Playlist.associate = (models) => {
        Playlist.hasMany(models.PlaylistPodcast, {
            onDelete: 'CASCADE'
        });
        Playlist.belongsTo(models.Creator);
        Playlist.belongsTo(models.Channel);
        Playlist.belongsToMany(models.Podcast, { through: models.PlaylistPodcast })
    }

    return Playlist;
};