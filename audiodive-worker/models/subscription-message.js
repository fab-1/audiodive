"use strict";

module.exports = function(sequelize, DataTypes) {

    const SubscriptionMessage = sequelize.define('SubscriptionMessage', {
        config: {
            type: DataTypes.TEXT
        }
    }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        classMethods: {
            associate: function(models) {
                SubscriptionMessage.belongsTo(models.Creator);
            }
        }
    });

    SubscriptionMessage.associate = (models) => {
        SubscriptionMessage.belongsTo(models.Creator);
    }

    return SubscriptionMessage;
};