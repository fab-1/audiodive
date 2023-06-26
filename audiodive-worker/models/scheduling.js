"use strict";

module.exports = function(sequelize, DataTypes) {

    const Scheduling = sequelize.define('Scheduling', {
        utcHour: {
            type: DataTypes.INTEGER
        },
        state: {
            type: DataTypes.ENUM('pending', 'processing', 'done', 'canceled'),
            defaultValue: 'pending'
        },
        config: {
            type: DataTypes.TEXT
        },
        userCount : {
            type: DataTypes.INTEGER
        }
    }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    });

    Scheduling.associate = (models) => {
        Scheduling.belongsTo(models.Creator);
    }

    return Scheduling;
};