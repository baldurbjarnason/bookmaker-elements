import xmlserializer from 'xmlserializer';
import '../vendor/endswith.js';
import 'element-closest';
import * as templates from './templates.js';
import * as zip from './zip.js';
import filesaver from '../vendor/FileSaver.js';

var manifestCounter = templates.getZeroPaddedStringCounter();
function manifestItem (href) {
  var type;
  if (href.endsWith('.png')) {
    type = 'image/png';
  } else if (href.endsWith('.jpg') || href.endsWith('.jpeg')) {
    type = 'image/jpeg';
  }
  return {
    href: href,
    type: type,
    id: 'item' + manifestCounter()
  };
}

export default {
  createdCallback: {
    value: function createdCallback () { console.log('created'); }
  },
  attachedCallback: {
    value: function attachedCallback () {
      // Eventually this should be optional
      this.chapters = Array.prototype.map.call(this.querySelectorAll('bm-chapter'), function (chapter, index) {
        var div = document.createElement('div');
        div.id = chapter.id;
        if (index !== 0) { div.setAttribute('style', 'page-break-before: always;'); }
        div.className = chapter.className;
        var chapterBody = chapter.querySelector('bm-chapter-body');
        var divBody = document.createElement('div');
        if (chapterBody && chapterBody.id) {
          divBody.id = chapterBody.id;
        }
        if (chapterBody && chapterBody.className) {
          divBody.className = chapterBody.className;
        }
        if (chapterBody) {
          divBody.innerHTML = chapterBody.innerHTML;
        } else {
          divBody.innerHTML = chapter.innerHTML;
        }
        div.appendChild(divBody);
        return xmlserializer.serializeToString(div).replace(' xmlns="http://www.w3.org/1999/xhtml"', '');
      }).join('\n');
      this.styles = Array.prototype.map.call(document.querySelectorAll('.bm-style'), function (style) {
        return style.textContent;
      }).join('\n');
      // this.styles = this.styles + '\n.bm-chapter { page-break-: always; }';
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
              if (heading.id && !heading.classList.contains('structural')) {
                return `<li><a href="index.xhtml#${heading.id}">${heading.textContent.trim()}</a></li>`;
              } else if (heading.classList.contains('structural')) {
                var parentId = heading.closest('bm-chapter, [role~=doc-chapter]').id;
                return `<li><a href="index.xhtml#${parentId}">${heading.textContent.trim()}</a></li>`;
              } else {
                return '\n';
              }
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
        }).catch(function (err) {
          console.error(err);
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
