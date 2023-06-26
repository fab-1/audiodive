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
        inviteToken: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.STRING
        },
        inviteTokenExpiresAt: {
            type: DataTypes.INTEGER
        },
        createdAt: {
            type: DataTypes.INTEGER
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


    return Creator;
};
