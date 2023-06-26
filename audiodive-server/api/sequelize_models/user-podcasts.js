"use strict"

module.exports = function (sequelize, DataTypes) {

    const UserPodcast = sequelize.define('UserPodcast', {

        FeedId: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        UserId: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        role: {
            type: DataTypes.ENUM('owner', 'subscriber'),
            allowNull: false,
            defaultValue: 'subscriber'
        }

    })

    UserPodcast.associate = (models) => {
        UserPodcast.belongsTo(models.User, {foreignKey: 'UserId'})
        UserPodcast.belongsTo(models.Feed, {foreignKey: 'FeedId'})
    }

    return UserPodcast
}
