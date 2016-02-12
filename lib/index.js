import 'whatwg-fetch';
import '../vendor/FileSaver.js';
import 'document-register-element';
import * as zip from './zip.js';
import BmBook from './BmBook.js';
import BmBookBody from './BmBookBody.js';
import BmCover from './BmCover.js';
import BmChapter from './BmChapter.js';
import BmChapterBody from './BmChapterBody.js';

var bmElements = {
  BmBook: document.registerElement('bm-book', BmBook),
  BmBookBody: document.registerElement('bm-book-body', BmBookBody),
  BmCover: document.registerElement('bm-cover', BmCover),
  BmChapter: document.registerElement('bm-chapter', BmChapter),
  BmChapterBody: document.registerElement('bm-chapter-body', BmChapterBody)
};

console.log(zip);

export default bmElements;
