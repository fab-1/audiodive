"use strict"

module.exports = function (sequelize, DataTypes) {

    const UserClip = sequelize.define('UserClip', {

        ClipId: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        UserId: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        role: {
            type: DataTypes.ENUM('owner', 'contributor', 'purchaser'),
            allowNull: false,
            defaultValue: 'contributor'
        }
    })

    UserClip.associate = (models) => {
        UserClip.belongsTo(models.User, {foreignKey: 'UserId'})
        UserClip.belongsTo(models.Clip, {foreignKey: 'ClipId'})
    }

    return UserClip
}
