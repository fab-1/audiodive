"use strict";

module.exports = function(sequelize, DataTypes) {

    const UserPodcast = sequelize.define('UserPodcast', {
        viewCount: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    });

    UserPodcast.associate = (models) => {
        UserPodcast.belongsTo(models.Podcast);
        UserPodcast.belongsTo(models.User);
    }

    return UserPodcast;
};