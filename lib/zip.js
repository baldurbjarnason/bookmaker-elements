// Module to wrap zip.js methods in Promises
import JSZip from '../vendor/jszip.js';

export function zipItem (filename, file) {
  return {
    href: filename,
    contents: file,
    options: { createFolders: false }
  };
}

function fetchAsset (href) {
  return fetch(href).then(function (result) {
    return result.arrayBuffer();
  });
}

export function makeZip (zipItems) {
  var zip = new JSZip();
  return zipItems.reduce(function (promise, item) {
    return promise.then(function () {
      if (item.contents) {
        return item.contents;
      } else {
        return fetchAsset(item.href);
      }
    }).then(function (contents) {
      return zip.file(item.href, contents, item.options);
    });
  }, Promise.resolve())
  .then(function () {
    return zip;
  });
}
