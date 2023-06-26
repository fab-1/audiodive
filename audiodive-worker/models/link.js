"use strict";

module.exports = function(sequelize, DataTypes) {

    const Link = sequelize.define('Link', {
        url : {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.ENUM('image', 'web', 'video', 'audio', 'file'),
            defaultValue: 'web'
        },
        isSponsored: {
            type: DataTypes.BOOLEAN
        },
        isIframe: {
            type: DataTypes.BOOLEAN
        },
        title: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING(600)
        },
        previewImage : {
            type: DataTypes.STRING(512)
        },
        resizedImage : {
            type: DataTypes.STRING
        },
        entityId: {
            type: DataTypes.STRING,
            unique: true
        }
    });

    Link.associate = (models) => {
        Link.belongsTo(models.Creator); // need to know who added the personality to prevent editing
        Link.belongsToMany(models.Podcast, { through: models.PodcastLinks });
    }

    return Link;
};