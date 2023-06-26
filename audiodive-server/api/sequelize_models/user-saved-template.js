"use strict"

module.exports = function (sequelize, DataTypes) {

    const UserSavedTemplate = sequelize.define('UserSavedTemplate', {

        TemplateId: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        UserId: {
            type: DataTypes.INTEGER,
            primaryKey: true
        }
    })

    UserSavedTemplate.associate = (models) => {
        UserSavedTemplate.belongsTo(models.User, {foreignKey: 'UserId'})
        UserSavedTemplate.belongsTo(models.Template, {foreignKey: 'TemplateId'})
    }

    return UserSavedTemplate
}
