"use strict"

module.exports = function (sequelize, DataTypes) {

    const Network = sequelize.define('Network', {
        name: {
            type: DataTypes.STRING
        }
    })

    Network.associate = (models) => {

    }

    return Network
}
