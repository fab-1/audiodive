"use strict"

module.exports = function (sequelize, DataTypes) {

    const ClipLayout = sequelize.define('ClipLayout',
        {
            name: {
                type: DataTypes.STRING
            },
            config: {
                type: DataTypes.TEXT
            },
            configSquare: {
                type: DataTypes.JSON
            },
            configWide: {
                type: DataTypes.JSON
            },
            configVertical: {
                type: DataTypes.JSON
            }
        }
    )

    ClipLayout.associate = (models) => {
        ClipLayout.belongsTo(models.Feed)
        //ClipLayout.belongsTo(models.Creator); // we could get that from Feed, but I'd rather save a join

        //Podcast.belongsToMany(models.Playlist, { through: models.PlaylistPodcast });
    }

    return ClipLayout
}
