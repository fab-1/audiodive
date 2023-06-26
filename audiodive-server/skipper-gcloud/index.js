/**
 * Module dependencies
 */
const Writable = require("stream").Writable;
const _ = require("lodash");
const {Storage} = require("@google-cloud/storage");
const concat = require("concat-stream");
const mime = require("mime");

/**
 * skipper-gcs
 *
 * @param  {Object} globalOpts
 * @return {Object}
 */
module.exports = function GCSStore(globalOpts) {
  globalOpts = globalOpts || {}

  _.defaults(globalOpts, {
    bucket: ""
  })

  const gcs = new Storage({
    projectId: globalOpts.projectId
  })

  const bucket = gcs.bucket(globalOpts.bucket)

  const adapter = {

    ls: function(dirname, cb) {
      bucket.getFiles({ prefix: dirname, }, function(err, files) {
        if (err) {
          cb(err);
        } else {
          files = _.map(files, "name");
          cb(null, files);
        }
      });
    },


    read: function(fd, cb) {
      const remoteReadStream = bucket.file(fd).createReadStream();

      remoteReadStream
        .on("error", function(err) {
          cb(err);
        })
        .on("response", function() {
          // Server connected and responded with the specified status and headers.
        })
        .on("end", function() {
          // The file is fully downloaded.
        })
        .pipe(concat(function(data) {
          cb(null, data);
        }));
    },
    rm: function(fd, cb) {
      //bucket.file(fd).delete(cb);
    },
    /**
     * A simple receiver for Skipper that writes Upstreams to Google Cloud Storage
     *
     * @param  {Object} options
     * @return {Stream.Writable}
     */
    receive: function GCSReceiver(options) {
      options = options || {};
      options = _.defaults(options, globalOpts);
      const receiver__ = Writable({
        objectMode: true,
      });

      // This `_write` method is invoked each time a new file is received
      // from the Readable stream (Upstream) which is pumping filestreams
      // into this receiver.  (filename === `__newFile.filename`).
      receiver__._write = function onFile(__newFile, encoding, done) {
        const metadata = {};

        _.defaults(metadata, options.metadata);

        const filename = __newFile.fd.split('\\').join('/');
        const file = bucket.file(filename, { gzip: true });
        const stream = file.createWriteStream({
            metadata: metadata,
            gzip: true
        });

        stream.on("error", function(err) {
          receiver__.emit("error", err);
          return;
        });
        stream.on("finish", function() {
          __newFile.extra = file.metadata;
          if(globalOpts.public) {
            file.makePublic().then(() => {
              __newFile.extra.Location = "https://storage.googleapis.com/" + globalOpts.bucket + "/" + filename;
              done();
            });
          } else {
            done();
          }
        });
        __newFile.pipe(stream);
      };
      return receiver__;
    },
  };

  return adapter;
};
