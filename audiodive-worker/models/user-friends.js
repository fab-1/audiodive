"use strict";

module.exports = function(sequelize, DataTypes) {

  const UserSavedClip = sequelize.define('UserFriend', {

    FriendId: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    UserId: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }
  })

  UserSavedClip.associate = (models) => {
    UserSavedClip.belongsTo(models.User, {foreignKey: 'UserId'})
    UserSavedClip.belongsTo(models.User, {foreignKey: 'FriendId'})
  }

  return UserSavedClip;
};
