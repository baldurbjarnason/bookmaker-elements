import xmlserializer from 'xmlserializer';
import '../vendor/endswith.js';
import * as templates from './templates.js';
import * as zip from './zip.js';
import filesaver from '../vendor/FileSaver.js';

function manifestItem (href) {
  var type;
  if (href.endsWith('.png')) {
    type = 'image/png';
  } else if (href.endsWith('.jpg') || href.endsWith('.jpeg')) {
    type = 'image/jpeg';
  }
  return {
    href: href,
    type: type
  };
}

export default {
  createdCallback: {
    value: function createdCallback () { console.log('created'); }
  },
  attachedCallback: {
    value: function attachedCallback () {
      this.chapters = Array.prototype.map.call(this.querySelectorAll('bm-chapter'), function (chapter) {
        var div = document.createElement('div');
        div.id = chapter.id;
        div.className = chapter.className;
        var chapterBody = chapter.querySelector('bm-chapter-body');
        var divBody = document.createElement('div');
        divBody.id = chapterBody.id;
        divBody.className = chapterBody.className;
        divBody.innerHTML = chapterBody.innerHTML;
        div.appendChild(divBody);
        return xmlserializer.serializeToString(div).replace(' xmlns="http://www.w3.org/1999/xhtml"', '');
      }).join('\n');
      this.styles = Array.prototype.map.call(document.querySelectorAll('.bm-style'), function (style) {
        return style.textContent;
      }).join('\n');
      this.styles = this.styles + '\n.bm-chapter { page-break-before: always; }';
      this.manifest = Array.prototype.map.call(this.querySelectorAll('[src]'), function (src) {
        return manifestItem(src.getAttribute('src'));
      });
      var book = this;
      fetch('book.json')
        .then(function (result) { return result.json(); })
        .then(function (result) {
          book.meta = result;
          var cover = book.manifest.filter(function (file) { return file.href === book.meta.coverHref; })[0];
          if (!cover) {
            cover = manifestItem(book.meta.coverHref);
            cover.properties = ['cover-image'];
            cover.id = 'coverImage';
            book.manifest.push(cover);
          } else {
            cover.properties = ['cover-image'];
            cover.id = 'coverImage';
          }
          if (book.meta.outline) {
            book.outline = book.meta.outline;
          } else {
            book.outline = '\n<ol>\n' + Array.prototype.map.call(book.querySelectorAll('h1, h2'), function (heading) {
              return `<li><a href="index.xhtml#${heading.id}">${heading.textContent}</a></li>`;
            }).join('\n') + '\n</ol>\n';
          }
          if (book.meta.landmarks) {
            book.landmarks = book.meta.landmarks;
          }
          book.zipItems = [];
          book.zipItems.push({
            href: 'mimetype',
            contents: 'application/epub+zip',
            options: { compression: 'STORE', createFolders: false }
          });
          book.zipItems.push(zip.zipItem('book.opf', templates.renderOpf(book)));
          book.zipItems.push(zip.zipItem('toc.ncx', templates.renderNcx(book)));
          book.zipItems.push(zip.zipItem('nav.xhtml', templates.renderNav(book)));
          book.zipItems.push(zip.zipItem('index.xhtml', templates.renderHtml(book.meta.titles[0].value, book.styles, book.chapters)));
          book.zipItems.push({href: 'META-INF', contents: 'empty', options: {compression: 'STORE', dir: true }});
          book.zipItems.push(zip.zipItem('META-INF/container.xml', templates.renderContainerXml()));
          book.zipItems = book.zipItems.concat(book.manifest);
          return zip.makeZip(book.zipItems);
        }).then(function (zipFile) {
          var filename = book.meta.titles[0].value.toLowerCase().replace(/\W+/g, '-') + '.epub';
          book.zip = zipFile.generate({type: 'blob', mimeType: 'application/epub+zip', compression: 'DEFLATE'});
          filesaver.saveAs(book.zip, filename);
        });
    }
  },
  detachedCallback: {
    value: function detachedCallback () { console.log('detached'); }
  },
  attributeChangedCallback: {
    value: function attributeChangedCallback () { console.log('attributed'); }
  }
};
