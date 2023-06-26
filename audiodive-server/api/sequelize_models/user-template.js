"use strict"

module.exports = function (sequelize, DataTypes) {

    const UserTemplate = sequelize.define('UserTemplate', {

        TemplateId: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        UserId: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        role: {
            type: DataTypes.ENUM('owner', 'contributor'),
            allowNull: false,
            defaultValue: 'contributor'
        }
    })

    UserTemplate.associate = (models) => {
        UserTemplate.belongsTo(models.User, {foreignKey: 'UserId'})
        UserTemplate.belongsTo(models.Template, {foreignKey: 'TemplateId'})
    }

    return UserTemplate
}
