const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

module.exports = function (sails) {

    const db = {}

    return {

        models: db,

        initialize: (next) => {

            const options = {
                charset: 'utf8mb4',
                dialectOptions: {
                    charset: 'utf8mb4'
                },
                dialect: 'mysql'
            }

            const datastore = sails.config.datastores.default

            // if (datastore.socketPath) {
            //     options.dialectOptions.socketPath = datastore.socketPath
            //     options.logging = false
            // }

            const sequelize = new Sequelize(datastore.url, options)

            const baseDir = sails.config.appPath + '/api/sequelize_models/'

            fs
                .readdirSync(baseDir)
                .filter(file =>
                    (file.indexOf('.') !== 0) && (file.slice(-3) === '.js'))
                .forEach(file => {
                    //const model = sequelize['import'](path.join(baseDir, file))
                    const model = require(path.join(baseDir, file))(sequelize, Sequelize.DataTypes);
                    db[model.name] = model
                })

            Object.keys(db).forEach(modelName => {
                if (db[modelName].associate) {
                    db[modelName].associate(db)
                }
            })

            db.sequelize = sequelize
            db.Sequelize = Sequelize

            //sequelize.sync()

            next()
        }


    }


}
