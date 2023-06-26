"use strict";

module.exports = function(sequelize, DataTypes) {

    const PodcastTeaser = sequelize.define('PodcastTeaser', {
        start: {
            type: DataTypes.FLOAT
        },
        end: {
            type: DataTypes.FLOAT
        },
        totalDuration: {
            type: DataTypes.INTEGER
        },
        status: {
            type: DataTypes.ENUM('pending', 'processing', 'ready'),
            defaultValue: 'pending'
        },
        clipConfig:  {
            type: DataTypes.TEXT
        },
        videoUrl: {
            type: DataTypes.STRING
        },
        fbAttachmentId: {
            type: DataTypes.STRING
        },
        config: {
            type: DataTypes.JSON
        }
    }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    });

    return PodcastTeaser;
};