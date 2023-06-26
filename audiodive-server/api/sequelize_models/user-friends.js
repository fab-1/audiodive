"use strict"

module.exports = function (sequelize, DataTypes) {

    const UserFriend = sequelize.define('UserFriend', {

        FriendId: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        UserId: {
            type: DataTypes.INTEGER,
            primaryKey: true
        }
    })

    UserFriend.associate = (models) => {
        UserFriend.belongsTo(models.User, {foreignKey: 'UserId'})
        UserFriend.belongsTo(models.User, {foreignKey: 'FriendId'})
    }

    return UserFriend
}
