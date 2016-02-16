'use strict';

function getZeroPaddedStringCounter () {
  var counter = 0;
  return function () {
    counter = counter + 1;

    return counter;
  };
}

function writeAttribute (name, value) {
  if (value) {
    return ` ${name}="${value}"`;
  } else {
    return '';
  }
}

function getTags (tag, values) {
  return values.map(function (item) {
    return `    <${tag}${writeAttribute('id', item.id)}${writeAttribute('xml:lang', item.lang)}${writeAttribute('dir', item.dir)}>${item.value}</${tag}>`;
  }).join('\n');
}

function getModified () {
  var pad = function (n) {
    var padded;
    if (n < 10) {
      padded = '0' + n;
    } else {
      padded = n;
    }
    return padded;
  };
  var date = new Date();
  return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate()) + 'T' + pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()) + ':' + pad(date.getUTCSeconds()) + 'Z';
};

function getManifest (manifest) {
  return manifest.map(function (item) {
    var counter = getZeroPaddedStringCounter();
    if (item.properties && item.properties.length === 1) {
      item.properties = item.properties[0];
    } else if (item.properties) {
      item.properties = item.properties.join(' ');
    } else {
      item.properties = '';
    }
    if (!item.id) {
      item.id = 'item' + counter();
    }
    return `    <item${writeAttribute('id', item.id)}${writeAttribute('href', item.href)}${writeAttribute('media-type', item.type)}${writeAttribute('properties', item.properties)}/>`;
  }).join('\n');
}

export function renderHtml (title, styles, chapters) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style type="text/css" class="bm-style">
  ${styles}
  </style>
</head>
<body>
  ${chapters}
</body>
</html>`;
};

export function renderOpf (book) {
  return `<?xml version="1.0"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="ePub-UUID" prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
${getTags('dc:title', book.meta.titles)}
    <dc:identifier id="ePub-UUID">${book.meta.identifier}</dc:identifier>
${getTags('dc:creator', book.meta.creators)}
${getTags('dc:language', book.meta.languages)}
    <meta property="dcterms:modified">${getModified()}</meta>
    <dc:publisher>${book.meta.publisher}</dc:publisher>
    <meta property="ibooks:specified-fonts">true</meta>
    <meta property="ibooks:version">${book.meta.version}</meta>
    <meta name="cover" content="coverImage" />
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />
    <item id="book" href="index.xhtml" media-type="application/xhtml+xml" />
${getManifest(book.manifest)}
  </manifest>
  <spine toc="ncx">
    <itemref idref="book" />
  </spine>
</package>
`;
};

export function renderNcx (book) {
  var counter = getZeroPaddedStringCounter();
  var navPoints = Array.prototype.map.call(book.querySelectorAll('h1, h2'), function (heading) {
    return `
  <navPoint id="navPoint-${counter()}">
    <navLabel><text>${heading.textContent}</text></navLabel>
    <content src="index.xhtml#${heading.id}" />
  </navPoint>`;
  }).join('\n');
  return `<ncx version="2005-1" xml:lang="${book.meta.languages[0].value}" xmlns="http://www.daisy.org/z3986/2005/ncx/">
  <head>
    <meta name="dtb:uid" content="${book.meta.identifier}"/>
    <meta name="dtb:depth" content="2"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>

  <docTitle>
    <text>${book.meta.titles[0].value}</text>
  </docTitle>
  <docAuthor>
    <text>${book.meta.creators[0].value}</text>
  </docAuthor>

  <navMap>
${navPoints}
  </navMap>
</ncx>
`;
};

export function renderNav (book) {
  var title = `<h1>${book.meta.titles[0].value}</h1>`;
  var nav = `<nav id="toc" class="toc h-toc" epub:type="toc" role="doc-toc">
      ${book.outline}
</nav>`;
  var landmarks;
  if (book.landmarks) {
    landmarks = `
<nav id="landmarks" class="landmarks h-landmarks" epub:type="landmarks">
    ${book.landmarks}
</nav>
`;
  } else {
    landmarks = '';
  }
  var contents = title + nav + landmarks;
  return renderHtml(book.meta.titles[0].value, '', contents);
};

export function renderContainerXml () {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="book.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`;
}
