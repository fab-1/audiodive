"use strict";

module.exports = function(sequelize, DataTypes) {

    const Personality = sequelize.define('Personality', {
        name: {
            type: DataTypes.STRING
        },
        role: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        },
        socialMediaLinks : {
            type: DataTypes.TEXT
        },
        image : {
            type: DataTypes.STRING
        },
        entityId: {
            type: DataTypes.STRING,
            unique: true
        }
    });

    Personality.associate = (models) => {
        Personality.belongsTo(models.Creator); // need to know who added the personality to prevent editing
        Personality.belongsToMany(models.Feed, { through: models.PodcastHosts });
    }

    return Personality;
};