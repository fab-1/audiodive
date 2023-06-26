"use strict";

module.exports = function(sequelize, DataTypes) {

    const CreatorAssets = sequelize.define('CreatorAssets',
        {
            name: {type: DataTypes.STRING},
            path: {type: DataTypes.STRING},
            type: {
                type: DataTypes.ENUM('audio', 'video', 'image', 'font'),
                allowNull: false,
                defaultValue: 'image'
            },
            metadata: {type: DataTypes.JSON}
        }
    )

    CreatorAssets.associate = (models) => {
        CreatorAssets.belongsTo(models.Feed);
        CreatorAssets.belongsTo(models.Creator); // we could get that from Feed, but I'd rather save a join

        //Podcast.belongsToMany(models.Playlist, { through: models.PlaylistPodcast });
    }

    return CreatorAssets;
};