"use strict";

module.exports = function(sequelize, DataTypes) {
    const FacebookPage = sequelize.define("FacebookPage", {

        applicationId: {
            type: DataTypes.STRING,
            primaryKey: true
        },

        name: {
            type: DataTypes.STRING
        },

        accessToken : {
            type: DataTypes.STRING
        }
    });

    return FacebookPage;
};