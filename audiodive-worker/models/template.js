"use strict";

module.exports = function(sequelize, DataTypes) {

    const Template = sequelize.define('Template',
        {
            name: {
                type: DataTypes.STRING
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
    );

  Template.associate = (models) => {
    Template.belongsTo(models.Feed);
        //ClipLayout.belongsTo(models.Creator); // we could get that from Feed, but I'd rather save a join

        //Podcast.belongsToMany(models.Playlist, { through: models.PlaylistPodcast });
  }

  return Template;
};
