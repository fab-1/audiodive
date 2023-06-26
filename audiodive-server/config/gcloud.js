const gcloudAdapter = require('../skipper-gcloud')

const gcloud = {
  projectId: process.env.GCLOUD_PROJECT_ID,
  bucket: process.env.GCLOUD_BUCKET,
  basePath: process.env.GCLOUD_BASE_PATH,
  adapter: gcloudAdapter,
  getPublicUrl:  (name) => {
    return `${gcloud.basePath}${gcloud.bucket}${name}`
  }
}

module.exports.gcloud = gcloud
