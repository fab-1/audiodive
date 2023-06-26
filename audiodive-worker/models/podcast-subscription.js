"use strict";

module.exports = function(sequelize, DataTypes) {

  const PodcastSubscription = sequelize.define('PodcastSubscription', {

  })

  PodcastSubscription.associate = (models) => {
    PodcastSubscription.belongsTo(models.Feed)
    PodcastSubscription.belongsTo(models.User)
  }

  return PodcastSubscription;
};
