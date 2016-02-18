# Todo

* role to epub:type
* src-set support
* url() support
* Auto role to landmarks
* Allow the user to select chapter and chapter-body selectors.
* Make all custom elements except the root bm-book optional.
* Test SVG and MathML support.
* Better error handling.
* Pretty much have to parse the CSS for url(). Probably using something like `String.prototype.match(/url\(\s*?((?:"|')?)(.+?)\1\s*?\)/gi); // Returns the match, quote style, url.`. So generate an epub manifest by parsing the CSS for url() and the HTML for [src] and [src-set]
* `<paged-generated-chapter type="toc">` or `<paged-generated-chapter type="titlepage">`
* Need to remember in the future (when I get to that) that IDs in HTML sources may not be valide XHTML IDs.
