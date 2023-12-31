"use strict";

import Gif from './gif.js';
import StreamReader from './stream_reader.js';
import { Promises } from './utils.js';

var url = (URL && URL.createObjectURL) ? URL : webkitURL;

var gifCache = new Map();
export default class Exploder {
  constructor(file) {
    this.file = file;
  }

  load() {
    var cachedGifPromise = gifCache.get(this.file)
    if (cachedGifPromise) return cachedGifPromise;

    var gifPromise = Promises.xhrGet(this.file, '*/*', 'arraybuffer')
      .then(buffer => this.explode(buffer));

    gifCache.set(this.file, gifPromise);
    return gifPromise;
  }

  explodeNew(buffer) {

      return new Promise((resolve, reject) => {

          var gif = new Uint8Array(buffer)
          var pos = 0;
          var delayTimes = [];
          var loadCnt = 0;
          var graphicControl = null;
          var imageData = null;
          var frames = [];
          var loopCnt = 0;
          if (gif[0] === 0x47 && gif[1] === 0x49 && gif[2] === 0x46 && // 'GIF'
              gif[3] === 0x38 && gif[4] === 0x39 && gif[5] === 0x61) { // '89a'
              pos += 13 + (+!!(gif[10] & 0x80) * Math.pow(2, (gif[10] & 0x07) + 1) * 3);
              var gifHeader = gif.subarray(0, pos);
              while (gif[pos] && gif[pos] !== 0x3b) {
                  var offset = pos, blockId = gif[pos];
                  if (blockId === 0x21) {
                      var label = gif[++pos];
                      if ([0x01, 0xfe, 0xf9, 0xff].indexOf(label) !== -1) {
                          label === 0xf9 && (delayTimes.push((gif[pos + 3] + (gif[pos + 4] << 8)) * 10));
                          label === 0xff && (loopCnt = gif[pos + 15] + (gif[pos + 16] << 8));
                          while (gif[++pos]) pos += gif[pos];
                          label === 0xf9 && (graphicControl = gif.subarray(offset, pos + 1));
                      } else {
                          errorCB && errorCB('parseGIF: unknown label');
                          break;
                      }
                  } else if (blockId === 0x2c) {
                      pos += 9;
                      pos += 1 + (+!!(gif[pos] & 0x80) * (Math.pow(2, (gif[pos] & 0x07) + 1) * 3));
                      while (gif[++pos]) pos += gif[pos];
                      var imageData = gif.subarray(offset, pos + 1);
                      var blob = new Blob([gifHeader, graphicControl, imageData])
                      var url = URL.createObjectURL(blob)
                      frames.push({
                          blob: blob,
                          url: url
                      });
                  } else {
                      console.error('parseGIF: unknown blockId');
                      break;
                  }
                  pos++;
              }
          }

          resolve(new Gif(frames))
      })
  }

  explode(buffer) {
    console.debug("EXPLODING " + this.file)
    return new Promise((resolve, reject) => {
      var frames = [],
        streamReader = new StreamReader(buffer);

      // Ensure this is an animated GIF
      if (streamReader.readAscii(6) != "GIF89a") {
        reject(Error("Not a GIF!"));
        return;
      }

      streamReader.skipBytes(4); // Height & Width
      if (streamReader.peekBit(1)) {
        streamReader.log("GLOBAL COLOR TABLE")
        var colorTableSize = streamReader.readByte() & 0x07;
        streamReader.log("GLOBAL COLOR TABLE IS " + 3 * Math.pow(2, colorTableSize + 1) + " BYTES")
        streamReader.skipBytes(2);
        streamReader.skipBytes(3 * Math.pow(2, colorTableSize + 1));
      } else {
        streamReader.log("NO GLOBAL COLOR TABLE")
      }
      // WE HAVE ENOUGH FOR THE GIF HEADER!
      var gifHeader = buffer.slice(0, streamReader.index);

      var spinning = true, expectingImage = false;
      while (spinning) {

        if (streamReader.isNext([0x21, 0xFF])) {
          streamReader.log("APPLICATION EXTENSION")
          streamReader.skipBytes(2);
          var blockSize = streamReader.readByte();
          streamReader.log(streamReader.readAscii(blockSize));

          if (streamReader.isNext([0x03, 0x01])) {
            // we cool
            streamReader.skipBytes(5)
          } else {
            streamReader.log("A weird application extension. Skip until we have 2 NULL bytes");
            while (!(streamReader.readByte() === 0 && streamReader.peekByte() === 0));
            streamReader.log("OK moving on")
            streamReader.skipBytes(1);
          }
        } else if (streamReader.isNext([0x21, 0xFE])) {
          streamReader.log("COMMENT EXTENSION")
          streamReader.skipBytes(2);

          while (!streamReader.isNext([0x00])) {
            var blockSize = streamReader.readByte();
            streamReader.log(streamReader.readAscii(blockSize));
          }
          streamReader.skipBytes(1); //NULL terminator

        } else if (streamReader.isNext([0x2c])) {
          streamReader.log("IMAGE DESCRIPTOR!");
          if (!expectingImage) {
            // This is a bare image, not prefaced with a Graphics Control Extension
            // so we should treat it as a frame.
            frames.push({ index: streamReader.index, delay: 0 });
          }
          expectingImage = false;

          streamReader.skipBytes(9);
          if (streamReader.peekBit(1)) {
            streamReader.log("LOCAL COLOR TABLE");
            var colorTableSize = streamReader.readByte() & 0x07;
            streamReader.log("LOCAL COLOR TABLE IS " + 3 * Math.pow(2, colorTableSize + 1) + " BYTES")
            streamReader.skipBytes(3 * Math.pow(2, colorTableSize + 1));
          } else {
            streamReader.log("NO LOCAL TABLE PHEW");
            streamReader.skipBytes(1);
          }

          streamReader.log("MIN CODE SIZE " + streamReader.readByte());
          streamReader.log("DATA START");

          while (!streamReader.isNext([0x00])) {
            var blockSize = streamReader.readByte();
//        streamReader.log("SKIPPING " + blockSize + " BYTES");
            streamReader.skipBytes(blockSize);
          }
          streamReader.log("DATA END");
          streamReader.skipBytes(1); //NULL terminator
        } else if (streamReader.isNext([0x21, 0xF9, 0x04])) {
          streamReader.log("GRAPHICS CONTROL EXTENSION!");
          // We _definitely_ have a frame. Now we're expecting an image
          var index = streamReader.index;

          streamReader.skipBytes(3);
          var disposalMethod = streamReader.readByte() >> 2;
          streamReader.log("DISPOSAL " + disposalMethod);
          var delay = streamReader.readByte() + streamReader.readByte() * 256;
          frames.push({ index: index, delay: delay, disposal: disposalMethod });
          streamReader.log("FRAME DELAY " + delay);
          streamReader.skipBytes(2);
          expectingImage = true;
        } else {
          var maybeTheEnd = streamReader.index;
          while (!streamReader.finished() && !streamReader.isNext([0x21, 0xF9, 0x04])) {
            streamReader.readByte();
          }
          if (streamReader.finished()) {
            streamReader.index = maybeTheEnd;
            streamReader.log("WE END");
            spinning = false;
          } else {
            streamReader.log("UNKNOWN DATA FROM " + maybeTheEnd);
          }
        }
      }
      var endOfFrames = streamReader.index;

      var gifFooter = buffer.slice(-1); //last bit is all we need
      for (var i = 0; i < frames.length; i++) {
        var frame = frames[i];
        var nextIndex = (i < frames.length - 1) ? frames[i + 1].index : endOfFrames;
        frame.blob = new Blob([ gifHeader, buffer.slice(frame.index, nextIndex), gifFooter ], {type: 'image/gif'});
        frame.url = url.createObjectURL(frame.blob);
      }

      resolve(new Gif(frames));
    })
  }
}
