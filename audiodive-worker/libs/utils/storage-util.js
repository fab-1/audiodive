const {Storage} = require('@google-cloud/storage')

const CLOUD_BUCKET = process.env.GCLOUD_BUCKET
const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT_ID
})

const BASE_PATH = `https://storage.googleapis.com/${CLOUD_BUCKET}`

module.exports = {
    bucket: storage.bucket(CLOUD_BUCKET),
    getPublicUrl: path => {
        if (path.includes('https')) {
            return path
        }
        else return `${BASE_PATH}${path}`
    },
    basePath: BASE_PATH
}