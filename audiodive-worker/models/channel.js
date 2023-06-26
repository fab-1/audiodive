"use strict";

module.exports = function(sequelize, DataTypes) {

    const Channel = sequelize.define('Channel', {
        name: {
            type: DataTypes.STRING
        }
    });

    Channel.associate = (models) => {
        //Channel.belongsTo(models.FacebookPage);
        Channel.belongsTo(models.Network);
        Channel.belongsTo(models.FacebookPage);
        Channel.belongsToMany(models.Creator, {
            through: models.ChannelCreators
        });
    }

    return Channel;
};