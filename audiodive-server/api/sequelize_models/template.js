"use strict"
const gcloud = require('../../config/gcloud').gcloud
module.exports = function (sequelize, DataTypes) {

    const Template = sequelize.define('Template',
        {
            name: {
                type: DataTypes.STRING
            },
            configSquare: {
                type: DataTypes.JSON
            },
            imageUrl: {
                type: DataTypes.VIRTUAL,
                get() {
                    const configSquare = this.getDataValue('configSquare')
                    if (!configSquare) return null

                    if (configSquare.previewPicture) {
                       return gcloud.basePath + gcloud.bucket + configSquare.previewPicture
                    }
                    return null
                }
            },
            configWide: {
                type: DataTypes.JSON
            },
            configVertical: {
                type: DataTypes.JSON
            },
            configInsta: {
                type: DataTypes.JSON
            }
        }
    )

    Template.associate = (models) => {
        Template.belongsTo(models.Feed)
        Template.hasMany(models.Clip)
        Template.hasMany(models.UserTemplate, {
            // onDelete: 'CASCADE'
        })

        //ClipLayout.belongsTo(models.Creator); // we could get that from Feed, but I'd rather save a join

        //Podcast.belongsToMany(models.Playlist, { through: models.PlaylistPodcast });
    }

    return Template
}
