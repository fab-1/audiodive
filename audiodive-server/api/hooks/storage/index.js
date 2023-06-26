const {Storage} = require('@google-cloud/storage')
const fs = require('fs')

module.exports = function (sails) {

    console.log(sails.config.gcloud)


    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_CREDENTIALS) {
        console.log('writing file', process.env.GOOGLE_APPLICATION_CREDENTIALS)
        fs.writeFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, process.env.GOOGLE_CREDENTIALS)
    }

    const gcloudConfig = sails.config.gcloud
    const storage = new Storage({
        projectId: gcloudConfig.projectId
    })
    const bucket = storage.bucket(gcloudConfig.bucket)

    return {

        initialize: (next) => {
            next()
        },

        bucket: bucket

    }

}
