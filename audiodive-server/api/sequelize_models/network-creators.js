"use strict"

module.exports = function (sequelize, DataTypes) {

    const NetworkCreators = sequelize.define('NetworkCreators', {
        type: {
            type: DataTypes.ENUM('admin', 'contributor', 'creative', 'host'),
            allowNull: false,
            defaultValue: 'contributor'
        }
    })

    NetworkCreators.associate = (models) => {
        //NetworkCreators.belongsTo(models.Creator);
        NetworkCreators.belongsTo(models.Network)
    }

    return NetworkCreators
}
