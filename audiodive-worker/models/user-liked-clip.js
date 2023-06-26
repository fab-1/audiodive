"use strict";

module.exports = function(sequelize, DataTypes) {

  const UserSavedClip = sequelize.define('UserSavedClip', {

    ClipId: {
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
    UserSavedClip.belongsTo(models.Clip, {foreignKey: 'ClipId'})
  }

  return UserSavedClip;
};
