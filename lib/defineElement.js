import 'document-register-element/build/document-register-element.max.js';

export default function defineElement (tagname, customElement) {
  return document.registerElement(tagname, { prototype: Object.create(HTMLElement.prototype, customElement) });
};
