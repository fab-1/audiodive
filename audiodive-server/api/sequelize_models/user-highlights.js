"use strict"

module.exports = function (sequelize, DataTypes) {

    const UserHighlights = sequelize.define('UserHighlights', {

        UserId: {
            type: DataTypes.INTEGER
        },

        data: {
            type: DataTypes.JSON
        }
    })

    UserHighlights.associate = (models) => {
        UserHighlights.belongsTo(models.User, {foreignKey: 'UserId'})
    }

    return UserHighlights
}
