"use strict";

module.exports = (sequelize, DataTypes) => {
    const Creator = sequelize.define("Creator", {

        firstName: {
            type: DataTypes.STRING
        },
        lastName: {
            type: DataTypes.STRING
        },
        facebookLoginId: {
            type: DataTypes.STRING,
            unique: true
        },
        twitterId: {
            type: DataTypes.STRING,
            unique: true
        },
        email: {
            type: DataTypes.STRING
        },
        socialEmail: {
            type: DataTypes.STRING
        },
        isAdmin: {
            type: DataTypes.BOOLEAN
        },
        facebookToken: {
            type: DataTypes.STRING
        },
        twitterToken: {
            type: DataTypes.STRING
        },
        inviteToken: {
            type: DataTypes.STRING
        },
        patreonToken: {
            type: DataTypes.STRING
        },
        profilePicture: {
            type: DataTypes.STRING
        },
        amplitudeKey: {
            type: DataTypes.STRING
        },
        amplitudeSecret: {
            type: DataTypes.STRING
        },
        termsAccepted: {
            type: DataTypes.BOOLEAN
        },
        loginCodeExpiry: {
            type: DataTypes.DATE
        },
        loginCode: {
            type: DataTypes.INTEGER
        },
        lastLogin: {
            type: DataTypes.DATE
        },
        password: {
            type: DataTypes.STRING
        }

    })

    Creator.associate = (models) => {
        Creator.belongsTo(models.FacebookPage);
        Creator.hasOne(models.Feed)
        Creator.belongsToMany(models.Network, {
            through: models.NetworkCreators
        });
        Creator.belongsToMany(models.Channel, {
            through: models.ChannelCreators
        });
        Creator.hasMany(models.NetworkCreators);
    }

    // // Class Method
    // Creator.associate = function (models) {
    //     Creator.belongsTo(models.FacebookPage);
    // };

    return Creator;
};