"use strict"
const gcloud = require('../../config/gcloud').gcloud

module.exports = function (sequelize, DataTypes) {

    const CreatorAssets = sequelize.define('CreatorAssets',
        {
            name: {type: DataTypes.STRING},
            path: {
                type: DataTypes.STRING,
                get() {
                    const path = this.getDataValue('path')
                    if (!path) return null
                    const urlPrefix = path.includes(gcloud.basePath) ? '' : gcloud.basePath + gcloud.bucket
                    return urlPrefix + path
                }
            },
            type: {
                type: DataTypes.ENUM('audio', 'video', 'image', 'font'),
                allowNull: false,
                defaultValue: 'image'
            },
            CreatorId: DataTypes.INTEGER,
            metadata: {type: DataTypes.JSON}
        }
    )

    CreatorAssets.associate = (models) => {
        CreatorAssets.belongsTo(models.Feed)
        CreatorAssets.belongsTo(models.User)
        //CreatorAssets.belongsTo(models.Creator); // we could get that from Feed, but I'd rather save a join

    }

    return CreatorAssets
}
