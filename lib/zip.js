// Module to wrap zip.js methods in Promises
import '../vendor/zip.js';

zip.workerScripts = {
  deflater: ['lib/z-worker.min.js', 'lib/pako_deflate.min.js', 'lib/pako/codecs.min.js'],
  inflater: ['lib/z-worker.min.js', 'lib/pako_inflate.min.js', 'lib/pako/codecs.min.js']
};

function wrapZip (zipFile) {
  // Possible readers: zip.TextReader(text), zip.BlobReader(blob), zip.Data64URIReader(dataURI), zip.HttpReader(URL)
  // options: directory or compression (0 for uncompressed)
  zipFile.addAsync = function (name, reader, options) {
    return new Promise(function (resolve, reject) {
      zip.add(name, reader, resolve, options);
    });
  };
  // Should return a promise for the blob for the zip file.
  zipFile.closeAsync = function () {
    return new Promise(function (resolve, reject) {
      zip.close(resolve);
    });
  };
  return zipFile;
}

function wrapWriter (writer) {
  return new Promise(function (resolve, reject) {
    zip.createWriter(writer, resolve, reject);
  });
}

export function createWriter () {
  return wrapWriter(new zip.BlobWriter('application/epub+zip')).then(function (zip) {
    return wrapZip(zip);
  });
}

export function text (text) {
  return new zip.TextReader(text);
}

export function blob (blob) {
  return new zip.BlobReader(blob);
}

export function get (URL) {
  return new zip.HttpReader(URL);
}
