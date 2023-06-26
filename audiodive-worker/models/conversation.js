"use strict";

module.exports = function(sequelize, DataTypes) {

    const Conversation = sequelize.define('Conversation', {
        conversation: {
            type: DataTypes.TEXT
        }
    }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    });

    Conversation.associate = (models) => {
        Conversation.belongsTo(models.Creator);
        Conversation.belongsTo(models.Channel);
    }

    return Conversation;
};