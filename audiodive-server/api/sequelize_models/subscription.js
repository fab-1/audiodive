"use strict"

module.exports = function (sequelize, DataTypes) {

    const Subscription = sequelize.define('Subscription', {

        UserId: {
            type: DataTypes.INTEGER
        },
        data: {
            type: DataTypes.JSON
        },
        utcHour: {
            type: DataTypes.INTEGER
        },
        endPoint: {
            type: DataTypes.STRING,
        },
        type: {
            type: DataTypes.ENUM("daily"),
            defaultValue: "daily"
        }
    })

    Subscription.associate = (models) => {
        Subscription.belongsTo(models.User, {foreignKey: 'UserId'})
    }

    return Subscription
}
