"use strict"

module.exports = (sequelize, DataTypes) => {
    const Creator = sequelize.define("User", {

        fullName: {
            type: DataTypes.STRING
        },
        emailAddress: {
            type: DataTypes.STRING
        },
        isSuperAdmin: {
            type: DataTypes.BOOLEAN
        },
        tosAcceptedByIp: {
            type: DataTypes.STRING
        },

        membershipStartedAt: {
            type: DataTypes.DATE
        },

        accessLevel: {
            type: DataTypes.NUMBER
        },

        stripeSubscriptionId: {
            type: DataTypes.STRING
        },

        stripeInvoiceId: {
            type: DataTypes.STRING
        },

        stripePlanId: {
            type: DataTypes.STRING
        },

        affiliateCode: {
            type: DataTypes.STRING
        }

    }, {
        tableName: 'user',
        freezeTableName: true,
    })

    Creator.associate = (models) => {

        //Creator.hasOne(models.Feed)
        // Creator.belongsToMany(models.Network, {
        //     through: models.NetworkCreators
        // });
        //Creator.hasMany(models.NetworkCreators);
    }


    return Creator
}
