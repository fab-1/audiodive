"use strict";

module.exports = function(sequelize, DataTypes) {

    const ChannelCreators = sequelize.define('ChannelCreators', {
    });

    ChannelCreators.associate = (models) => {
        ChannelCreators.belongsTo(models.Channel, {
            onDelete: 'CASCADE'
        });
        ChannelCreators.belongsTo(models.Creator, {
            onDelete: 'CASCADE'
        });
    }

    return ChannelCreators;
};