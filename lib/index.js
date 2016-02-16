import 'whatwg-fetch';
import book from './BmBook.js';
import bookBody from './BmBookBody.js';
import cover from './BmCover.js';
import chapter from './BmChapter.js';
import chapterBody from './BmChapterBody.js';
import defineElement from './defineElement.js';

export var BmBook = defineElement('bm-book', book);
export var BmBookBody = defineElement('bm-book-body', bookBody);
export var BmCover = defineElement('bm-cover', cover);
export var BmChapter = defineElement('bm-chapter', chapter);
export var BmChapterBody = defineElement('bm-chapter-body', chapterBody);

