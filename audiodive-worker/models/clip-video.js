module.exports = (sequelize, DataTypes) => {

    const ClipVideo = sequelize.define("ClipVideo", {
        videoUrl: DataTypes.STRING,
        imageUrl: DataTypes.STRING,
        gifUrl: DataTypes.STRING,
        name: DataTypes.STRING,
        ratio: DataTypes.STRING,
        ready: DataTypes.BOOLEAN
    })

    ClipVideo.associate = models => {
        ClipVideo.belongsTo(models.Clip)
        ClipVideo.belongsTo(models.User)
    }

    return ClipVideo
}