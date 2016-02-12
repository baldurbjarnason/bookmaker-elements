var babelHelpers = {};

babelHelpers.classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

babelHelpers.createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

babelHelpers.inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

babelHelpers.possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

babelHelpers;


var __commonjs_global = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this;
function __commonjs(fn, module) { return module = { exports: {} }, fn(module, module.exports, __commonjs_global), module.exports; }

(function (self) {
  'use strict';

  if (self.fetch) {
    return;
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name');
    }
    return name.toLowerCase();
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value;
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function (value, name) {
        this.append(name, value);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function (name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function (name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var list = this.map[name];
    if (!list) {
      list = [];
      this.map[name] = list;
    }
    list.push(value);
  };

  Headers.prototype['delete'] = function (name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function (name) {
    var values = this.map[normalizeName(name)];
    return values ? values[0] : null;
  };

  Headers.prototype.getAll = function (name) {
    return this.map[normalizeName(name)] || [];
  };

  Headers.prototype.has = function (name) {
    return this.map.hasOwnProperty(normalizeName(name));
  };

  Headers.prototype.set = function (name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)];
  };

  Headers.prototype.forEach = function (callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function (name) {
      this.map[name].forEach(function (value) {
        callback.call(thisArg, value, name, this);
      }, this);
    }, this);
  };

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'));
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function (resolve, reject) {
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(reader.error);
      };
    });
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    return fileReaderReady(reader);
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    reader.readAsText(blob);
    return fileReaderReady(reader);
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && function () {
      try {
        new Blob();
        return true;
      } catch (e) {
        return false;
      }
    }(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function Body() {
    this.bodyUsed = false;

    this._initBody = function (body) {
      this._bodyInit = body;
      if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (!body) {
        this._bodyText = '';
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
          throw new Error('unsupported BodyInit type');
        }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        }
      }
    };

    if (support.blob) {
      this.blob = function () {
        var rejected = consumed(this);
        if (rejected) {
          return rejected;
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob);
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob');
        } else {
          return Promise.resolve(new Blob([this._bodyText]));
        }
      };

      this.arrayBuffer = function () {
        return this.blob().then(readBlobAsArrayBuffer);
      };

      this.text = function () {
        var rejected = consumed(this);
        if (rejected) {
          return rejected;
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob);
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text');
        } else {
          return Promise.resolve(this._bodyText);
        }
      };
    } else {
      this.text = function () {
        var rejected = consumed(this);
        return rejected ? rejected : Promise.resolve(this._bodyText);
      };
    }

    if (support.formData) {
      this.formData = function () {
        return this.text().then(decode);
      };
    }

    this.json = function () {
      return this.text().then(JSON.parse);
    };

    return this;
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method;
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read');
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      if (!body) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = input;
    }

    this.credentials = options.credentials || this.credentials || 'omit';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests');
    }
    this._initBody(body);
  }

  Request.prototype.clone = function () {
    return new Request(this);
  };

  function decode(body) {
    var form = new FormData();
    body.trim().split('&').forEach(function (bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form;
  }

  function headers(xhr) {
    var head = new Headers();
    var pairs = xhr.getAllResponseHeaders().trim().split('\n');
    pairs.forEach(function (header) {
      var split = header.trim().split(':');
      var key = split.shift().trim();
      var value = split.join(':').trim();
      head.append(key, value);
    });
    return head;
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = options.statusText;
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function () {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    });
  };

  Response.error = function () {
    var response = new Response(null, { status: 0, statusText: '' });
    response.type = 'error';
    return response;
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function (url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code');
    }

    return new Response(null, { status: status, headers: { location: url } });
  };

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function (input, init) {
    return new Promise(function (resolve, reject) {
      var request;
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input;
      } else {
        request = new Request(input, init);
      }

      var xhr = new XMLHttpRequest();

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL;
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL');
        }

        return;
      }

      xhr.onload = function () {
        var status = xhr.status === 1223 ? 204 : xhr.status;
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'));
          return;
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        };
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function () {
        reject(new TypeError('Network request failed'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function (value, name) {
        xhr.setRequestHeader(name, value);
      });

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    });
  };
  self.fetch.polyfill = true;
})(typeof self !== 'undefined' ? self : this);

var FileSaver = __commonjs(function (module, exports, global) {
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.1.20151003
 *
 * By Eli Grey, http://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || function (view) {
	"use strict";
	// IE <10 is explicitly unsupported

	if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var doc = view.document
	// only get URL when necessary in case Blob.js hasn't overridden it yet
	,
	    get_URL = function get_URL() {
		return view.URL || view.webkitURL || view;
	},
	    save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"),
	    can_use_save_link = "download" in save_link,
	    click = function click(node) {
		var event = new MouseEvent("click");
		node.dispatchEvent(event);
	},
	    is_safari = /Version\/[\d\.]+.*Safari/.test(navigator.userAgent),
	    webkit_req_fs = view.webkitRequestFileSystem,
	    req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem,
	    throw_outside = function throw_outside(ex) {
		(view.setImmediate || view.setTimeout)(function () {
			throw ex;
		}, 0);
	},
	    force_saveable_type = "application/octet-stream",
	    fs_min_size = 0
	// See https://code.google.com/p/chromium/issues/detail?id=375297#c7 and
	// https://github.com/eligrey/FileSaver.js/commit/485930a#commitcomment-8768047
	// for the reasoning behind the timeout and revocation flow
	,
	    arbitrary_revoke_timeout = 500 // in ms
	,
	    revoke = function revoke(file) {
		var revoker = function revoker() {
			if (typeof file === "string") {
				// file is an object URL
				get_URL().revokeObjectURL(file);
			} else {
				// file is a File
				file.remove();
			}
		};
		if (view.chrome) {
			revoker();
		} else {
			setTimeout(revoker, arbitrary_revoke_timeout);
		}
	},
	    dispatch = function dispatch(filesaver, event_types, event) {
		event_types = [].concat(event_types);
		var i = event_types.length;
		while (i--) {
			var listener = filesaver["on" + event_types[i]];
			if (typeof listener === "function") {
				try {
					listener.call(filesaver, event || filesaver);
				} catch (ex) {
					throw_outside(ex);
				}
			}
		}
	},
	    auto_bom = function auto_bom(blob) {
		// prepend BOM for UTF-8 XML and text/* types (including HTML)
		if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
			return new Blob(["﻿", blob], { type: blob.type });
		}
		return blob;
	},
	    FileSaver = function FileSaver(blob, name, no_auto_bom) {
		if (!no_auto_bom) {
			blob = auto_bom(blob);
		}
		// First try a.download, then web filesystem, then object URLs
		var filesaver = this,
		    type = blob.type,
		    blob_changed = false,
		    object_url,
		    target_view,
		    dispatch_all = function dispatch_all() {
			dispatch(filesaver, "writestart progress write writeend".split(" "));
		}
		// on any filesys errors revert to saving with object URLs
		,
		    fs_error = function fs_error() {
			if (target_view && is_safari && typeof FileReader !== "undefined") {
				// Safari doesn't allow downloading of blob urls
				var reader = new FileReader();
				reader.onloadend = function () {
					var base64Data = reader.result;
					target_view.location.href = "data:attachment/file" + base64Data.slice(base64Data.search(/[,;]/));
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
				};
				reader.readAsDataURL(blob);
				filesaver.readyState = filesaver.INIT;
				return;
			}
			// don't create more object URLs than needed
			if (blob_changed || !object_url) {
				object_url = get_URL().createObjectURL(blob);
			}
			if (target_view) {
				target_view.location.href = object_url;
			} else {
				var new_tab = view.open(object_url, "_blank");
				if (new_tab == undefined && is_safari) {
					//Apple do not allow window.open, see http://bit.ly/1kZffRI
					view.location.href = object_url;
				}
			}
			filesaver.readyState = filesaver.DONE;
			dispatch_all();
			revoke(object_url);
		},
		    abortable = function abortable(func) {
			return function () {
				if (filesaver.readyState !== filesaver.DONE) {
					return func.apply(this, arguments);
				}
			};
		},
		    create_if_not_found = { create: true, exclusive: false },
		    slice;
		filesaver.readyState = filesaver.INIT;
		if (!name) {
			name = "download";
		}
		if (can_use_save_link) {
			object_url = get_URL().createObjectURL(blob);
			setTimeout(function () {
				save_link.href = object_url;
				save_link.download = name;
				click(save_link);
				dispatch_all();
				revoke(object_url);
				filesaver.readyState = filesaver.DONE;
			});
			return;
		}
		// Object and web filesystem URLs have a problem saving in Google Chrome when
		// viewed in a tab, so I force save with application/octet-stream
		// http://code.google.com/p/chromium/issues/detail?id=91158
		// Update: Google errantly closed 91158, I submitted it again:
		// https://code.google.com/p/chromium/issues/detail?id=389642
		if (view.chrome && type && type !== force_saveable_type) {
			slice = blob.slice || blob.webkitSlice;
			blob = slice.call(blob, 0, blob.size, force_saveable_type);
			blob_changed = true;
		}
		// Since I can't be sure that the guessed media type will trigger a download
		// in WebKit, I append .download to the filename.
		// https://bugs.webkit.org/show_bug.cgi?id=65440
		if (webkit_req_fs && name !== "download") {
			name += ".download";
		}
		if (type === force_saveable_type || webkit_req_fs) {
			target_view = view;
		}
		if (!req_fs) {
			fs_error();
			return;
		}
		fs_min_size += blob.size;
		req_fs(view.TEMPORARY, fs_min_size, abortable(function (fs) {
			fs.root.getDirectory("saved", create_if_not_found, abortable(function (dir) {
				var save = function save() {
					dir.getFile(name, create_if_not_found, abortable(function (file) {
						file.createWriter(abortable(function (writer) {
							writer.onwriteend = function (event) {
								target_view.location.href = file.toURL();
								filesaver.readyState = filesaver.DONE;
								dispatch(filesaver, "writeend", event);
								revoke(file);
							};
							writer.onerror = function () {
								var error = writer.error;
								if (error.code !== error.ABORT_ERR) {
									fs_error();
								}
							};
							"writestart progress write abort".split(" ").forEach(function (event) {
								writer["on" + event] = filesaver["on" + event];
							});
							writer.write(blob);
							filesaver.abort = function () {
								writer.abort();
								filesaver.readyState = filesaver.DONE;
							};
							filesaver.readyState = filesaver.WRITING;
						}), fs_error);
					}), fs_error);
				};
				dir.getFile(name, { create: false }, abortable(function (file) {
					// delete file if it already exists
					file.remove();
					save();
				}), abortable(function (ex) {
					if (ex.code === ex.NOT_FOUND_ERR) {
						save();
					} else {
						fs_error();
					}
				}));
			}), fs_error);
		}), fs_error);
	},
	    FS_proto = FileSaver.prototype,
	    saveAs = function saveAs(blob, name, no_auto_bom) {
		return new FileSaver(blob, name, no_auto_bom);
	};
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function (blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name || "download");
		};
	}

	FS_proto.abort = function () {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null;

	return saveAs;
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || __commonjs_global.content);
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
	module.exports.saveAs = saveAs;
} else if (typeof define !== "undefined" && define !== null && define.amd != null) {
	define([], function () {
		return saveAs;
	});
}
});

/*! (C) WebReflection Mit Style License */
(function (e, t, n, r) {
  "use strict";
  function rt(e, t) {
    for (var n = 0, r = e.length; n < r; n++) {
      vt(e[n], t);
    }
  }function it(e) {
    for (var t = 0, n = e.length, r; t < n; t++) {
      r = e[t], nt(r, b[ot(r)]);
    }
  }function st(e) {
    return function (t) {
      j(t) && (vt(t, e), rt(t.querySelectorAll(w), e));
    };
  }function ot(e) {
    var t = e.getAttribute("is"),
        n = e.nodeName.toUpperCase(),
        r = S.call(y, t ? v + t.toUpperCase() : d + n);return t && -1 < r && !ut(n, t) ? -1 : r;
  }function ut(e, t) {
    return -1 < w.indexOf(e + '[is="' + t + '"]');
  }function at(e) {
    var t = e.currentTarget,
        n = e.attrChange,
        r = e.attrName,
        i = e.target;Q && (!i || i === t) && t.attributeChangedCallback && r !== "style" && e.prevValue !== e.newValue && t.attributeChangedCallback(r, n === e[a] ? null : e.prevValue, n === e[l] ? null : e.newValue);
  }function ft(e) {
    var t = st(e);return function (e) {
      X.push(t, e.target);
    };
  }function lt(e) {
    K && (K = !1, e.currentTarget.removeEventListener(h, lt)), rt((e.target || t).querySelectorAll(w), e.detail === o ? o : s), B && pt();
  }function ct(e, t) {
    var n = this;q.call(n, e, t), G.call(n, { target: n });
  }function ht(e, t) {
    D(e, t), et ? et.observe(e, z) : (J && (e.setAttribute = ct, e[i] = Z(e), e.addEventListener(p, G)), e.addEventListener(c, at)), e.createdCallback && Q && (e.created = !0, e.createdCallback(), e.created = !1);
  }function pt() {
    for (var e, t = 0, n = F.length; t < n; t++) {
      e = F[t], E.contains(e) || (n--, F.splice(t--, 1), vt(e, o));
    }
  }function dt(e) {
    throw new Error("A " + e + " type is already registered");
  }function vt(e, t) {
    var n,
        r = ot(e);-1 < r && (tt(e, b[r]), r = 0, t === s && !e[s] ? (e[o] = !1, e[s] = !0, r = 1, B && S.call(F, e) < 0 && F.push(e)) : t === o && !e[o] && (e[s] = !1, e[o] = !0, r = 1), r && (n = e[t + "Callback"]) && n.call(e));
  }if (r in t) return;var i = "__" + r + (Math.random() * 1e5 >> 0),
      s = "attached",
      o = "detached",
      u = "extends",
      a = "ADDITION",
      f = "MODIFICATION",
      l = "REMOVAL",
      c = "DOMAttrModified",
      h = "DOMContentLoaded",
      p = "DOMSubtreeModified",
      d = "<",
      v = "=",
      m = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/,
      g = ["ANNOTATION-XML", "COLOR-PROFILE", "FONT-FACE", "FONT-FACE-SRC", "FONT-FACE-URI", "FONT-FACE-FORMAT", "FONT-FACE-NAME", "MISSING-GLYPH"],
      y = [],
      b = [],
      w = "",
      E = t.documentElement,
      S = y.indexOf || function (e) {
    for (var t = this.length; t-- && this[t] !== e;) {}return t;
  },
      x = n.prototype,
      T = x.hasOwnProperty,
      N = x.isPrototypeOf,
      C = n.defineProperty,
      k = n.getOwnPropertyDescriptor,
      L = n.getOwnPropertyNames,
      A = n.getPrototypeOf,
      O = n.setPrototypeOf,
      M = !!n.__proto__,
      _ = n.create || function mt(e) {
    return e ? (mt.prototype = e, new mt()) : this;
  },
      D = O || (M ? function (e, t) {
    return e.__proto__ = t, e;
  } : L && k ? function () {
    function e(e, t) {
      for (var n, r = L(t), i = 0, s = r.length; i < s; i++) {
        n = r[i], T.call(e, n) || C(e, n, k(t, n));
      }
    }return function (t, n) {
      do {
        e(t, n);
      } while ((n = A(n)) && !N.call(n, t));return t;
    };
  }() : function (e, t) {
    for (var n in t) {
      e[n] = t[n];
    }return e;
  }),
      P = e.MutationObserver || e.WebKitMutationObserver,
      H = (e.HTMLElement || e.Element || e.Node).prototype,
      B = !N.call(H, E),
      j = B ? function (e) {
    return e.nodeType === 1;
  } : function (e) {
    return N.call(H, e);
  },
      F = B && [],
      I = H.cloneNode,
      q = H.setAttribute,
      R = H.removeAttribute,
      U = t.createElement,
      z = P && { attributes: !0, characterData: !0, attributeOldValue: !0 },
      W = P || function (e) {
    J = !1, E.removeEventListener(c, W);
  },
      X,
      V = e.requestAnimationFrame || e.webkitRequestAnimationFrame || e.mozRequestAnimationFrame || e.msRequestAnimationFrame || function (e) {
    setTimeout(e, 10);
  },
      $ = !1,
      J = !0,
      K = !0,
      Q = !0,
      G,
      Y,
      Z,
      et,
      tt,
      nt;O || M ? (tt = function tt(e, t) {
    N.call(t, e) || ht(e, t);
  }, nt = ht) : (tt = function tt(e, t) {
    e[i] || (e[i] = n(!0), ht(e, t));
  }, nt = tt), B ? (J = !1, function () {
    var e = k(H, "addEventListener"),
        t = e.value,
        n = function n(e) {
      var t = new CustomEvent(c, { bubbles: !0 });t.attrName = e, t.prevValue = this.getAttribute(e), t.newValue = null, t[l] = t.attrChange = 2, R.call(this, e), this.dispatchEvent(t);
    },
        r = function r(e, t) {
      var n = this.hasAttribute(e),
          r = n && this.getAttribute(e),
          i = new CustomEvent(c, { bubbles: !0 });q.call(this, e, t), i.attrName = e, i.prevValue = n ? r : null, i.newValue = t, n ? i[f] = i.attrChange = 1 : i[a] = i.attrChange = 0, this.dispatchEvent(i);
    },
        s = function s(e) {
      var t = e.currentTarget,
          n = t[i],
          r = e.propertyName,
          s;n.hasOwnProperty(r) && (n = n[r], s = new CustomEvent(c, { bubbles: !0 }), s.attrName = n.name, s.prevValue = n.value || null, s.newValue = n.value = t[r] || null, s.prevValue == null ? s[a] = s.attrChange = 0 : s[f] = s.attrChange = 1, t.dispatchEvent(s));
    };e.value = function (e, o, u) {
      e === c && this.attributeChangedCallback && this.setAttribute !== r && (this[i] = { className: { name: "class", value: this.className } }, this.setAttribute = r, this.removeAttribute = n, t.call(this, "propertychange", s)), t.call(this, e, o, u);
    }, C(H, "addEventListener", e);
  }()) : P || (E.addEventListener(c, W), E.setAttribute(i, 1), E.removeAttribute(i), J && (G = function G(e) {
    var t = this,
        n,
        r,
        s;if (t === e.target) {
      n = t[i], t[i] = r = Z(t);for (s in r) {
        if (!(s in n)) return Y(0, t, s, n[s], r[s], a);if (r[s] !== n[s]) return Y(1, t, s, n[s], r[s], f);
      }for (s in n) {
        if (!(s in r)) return Y(2, t, s, n[s], r[s], l);
      }
    }
  }, Y = function Y(e, t, n, r, i, s) {
    var o = { attrChange: e, currentTarget: t, attrName: n, prevValue: r, newValue: i };o[s] = e, at(o);
  }, Z = function Z(e) {
    for (var t, n, r = {}, i = e.attributes, s = 0, o = i.length; s < o; s++) {
      t = i[s], n = t.name, n !== "setAttribute" && (r[n] = t.value);
    }return r;
  })), t[r] = function (n, r) {
    c = n.toUpperCase(), $ || ($ = !0, P ? (et = function (e, t) {
      function n(e, t) {
        for (var n = 0, r = e.length; n < r; t(e[n++])) {}
      }return new P(function (r) {
        for (var i, s, o, u = 0, a = r.length; u < a; u++) {
          i = r[u], i.type === "childList" ? (n(i.addedNodes, e), n(i.removedNodes, t)) : (s = i.target, Q && s.attributeChangedCallback && i.attributeName !== "style" && (o = s.getAttribute(i.attributeName), o !== i.oldValue && s.attributeChangedCallback(i.attributeName, i.oldValue, o)));
        }
      });
    }(st(s), st(o)), et.observe(t, { childList: !0, subtree: !0 })) : (X = [], V(function E() {
      while (X.length) {
        X.shift().call(null, X.shift());
      }V(E);
    }), t.addEventListener("DOMNodeInserted", ft(s)), t.addEventListener("DOMNodeRemoved", ft(o))), t.addEventListener(h, lt), t.addEventListener("readystatechange", lt), t.createElement = function (e, n) {
      var r = U.apply(t, arguments),
          i = "" + e,
          s = S.call(y, (n ? v : d) + (n || i).toUpperCase()),
          o = -1 < s;return n && (r.setAttribute("is", n = n.toLowerCase()), o && (o = ut(i.toUpperCase(), n))), Q = !t.createElement.innerHTMLHelper, o && nt(r, b[s]), r;
    }, H.cloneNode = function (e) {
      var t = I.call(this, !!e),
          n = ot(t);return -1 < n && nt(t, b[n]), e && it(t.querySelectorAll(w)), t;
    }), -2 < S.call(y, v + c) + S.call(y, d + c) && dt(n);if (!m.test(c) || -1 < S.call(g, c)) throw new Error("The type " + n + " is invalid");var i = function i() {
      return f ? t.createElement(l, c) : t.createElement(l);
    },
        a = r || x,
        f = T.call(a, u),
        l = f ? r[u].toUpperCase() : c,
        c,
        p;return f && -1 < S.call(y, d + l) && dt(l), p = y.push((f ? v : d) + c) - 1, w = w.concat(w.length ? "," : "", f ? l + '[is="' + n.toLowerCase() + '"]' : l), i.prototype = b[p] = T.call(a, "prototype") ? a.prototype : _(H), rt(t.querySelectorAll(w), s), i;
  };
})(window, document, Object, "registerElement");

/*
 Copyright (c) 2013 Gildas Lormeau. All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in
 the documentation and/or other materials provided with the distribution.

 3. The names of the authors may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function (obj) {
	"use strict";

	var ERR_BAD_FORMAT = "File format is not recognized.";
	var ERR_CRC = "CRC failed.";
	var ERR_ENCRYPTED = "File contains encrypted entry.";
	var ERR_ZIP64 = "File is using Zip64 (4gb+ file size).";
	var ERR_READ = "Error while reading zip file.";
	var ERR_WRITE = "Error while writing zip file.";
	var ERR_WRITE_DATA = "Error while writing file data.";
	var ERR_READ_DATA = "Error while reading file data.";
	var ERR_DUPLICATED_NAME = "File already exists.";
	var CHUNK_SIZE = 512 * 1024;

	var TEXT_PLAIN = "text/plain";

	var appendABViewSupported;
	try {
		appendABViewSupported = new Blob([new DataView(new ArrayBuffer(0))]).size === 0;
	} catch (e) {}

	function Crc32() {
		this.crc = -1;
	}
	Crc32.prototype.append = function append(data) {
		var crc = this.crc | 0,
		    table = this.table;
		for (var offset = 0, len = data.length | 0; offset < len; offset++) {
			crc = crc >>> 8 ^ table[(crc ^ data[offset]) & 0xFF];
		}this.crc = crc;
	};
	Crc32.prototype.get = function get() {
		return ~this.crc;
	};
	Crc32.prototype.table = function () {
		var i,
		    j,
		    t,
		    table = []; // Uint32Array is actually slower than []
		for (i = 0; i < 256; i++) {
			t = i;
			for (j = 0; j < 8; j++) {
				if (t & 1) t = t >>> 1 ^ 0xEDB88320;else t = t >>> 1;
			}table[i] = t;
		}
		return table;
	}();

	// "no-op" codec
	function NOOP() {}
	NOOP.prototype.append = function append(bytes, onprogress) {
		return bytes;
	};
	NOOP.prototype.flush = function flush() {};

	function blobSlice(blob, index, length) {
		if (index < 0 || length < 0 || index + length > blob.size) throw new RangeError('offset:' + index + ', length:' + length + ', size:' + blob.size);
		if (blob.slice) return blob.slice(index, index + length);else if (blob.webkitSlice) return blob.webkitSlice(index, index + length);else if (blob.mozSlice) return blob.mozSlice(index, index + length);else if (blob.msSlice) return blob.msSlice(index, index + length);
	}

	function getDataHelper(byteLength, bytes) {
		var dataBuffer, dataArray;
		dataBuffer = new ArrayBuffer(byteLength);
		dataArray = new Uint8Array(dataBuffer);
		if (bytes) dataArray.set(bytes, 0);
		return {
			buffer: dataBuffer,
			array: dataArray,
			view: new DataView(dataBuffer)
		};
	}

	// Readers
	function Reader() {}

	function TextReader(text) {
		var that = this,
		    blobReader;

		function init(callback, onerror) {
			var blob = new Blob([text], {
				type: TEXT_PLAIN
			});
			blobReader = new BlobReader(blob);
			blobReader.init(function () {
				that.size = blobReader.size;
				callback();
			}, onerror);
		}

		function readUint8Array(index, length, callback, onerror) {
			blobReader.readUint8Array(index, length, callback, onerror);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	TextReader.prototype = new Reader();
	TextReader.prototype.constructor = TextReader;

	function Data64URIReader(dataURI) {
		var that = this,
		    dataStart;

		function init(callback) {
			var dataEnd = dataURI.length;
			while (dataURI.charAt(dataEnd - 1) == "=") {
				dataEnd--;
			}dataStart = dataURI.indexOf(",") + 1;
			that.size = Math.floor((dataEnd - dataStart) * 0.75);
			callback();
		}

		function readUint8Array(index, length, callback) {
			var i,
			    data = getDataHelper(length);
			var start = Math.floor(index / 3) * 4;
			var end = Math.ceil((index + length) / 3) * 4;
			var bytes = obj.atob(dataURI.substring(start + dataStart, end + dataStart));
			var delta = index - Math.floor(start / 4) * 3;
			for (i = delta; i < delta + length; i++) {
				data.array[i - delta] = bytes.charCodeAt(i);
			}callback(data.array);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	Data64URIReader.prototype = new Reader();
	Data64URIReader.prototype.constructor = Data64URIReader;

	function BlobReader(blob) {
		var that = this;

		function init(callback) {
			that.size = blob.size;
			callback();
		}

		function readUint8Array(index, length, callback, onerror) {
			var reader = new FileReader();
			reader.onload = function (e) {
				callback(new Uint8Array(e.target.result));
			};
			reader.onerror = onerror;
			try {
				reader.readAsArrayBuffer(blobSlice(blob, index, length));
			} catch (e) {
				onerror(e);
			}
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	BlobReader.prototype = new Reader();
	BlobReader.prototype.constructor = BlobReader;

	// Writers

	function Writer() {}
	Writer.prototype.getData = function (callback) {
		callback(this.data);
	};

	function TextWriter(encoding) {
		var that = this,
		    blob;

		function init(callback) {
			blob = new Blob([], {
				type: TEXT_PLAIN
			});
			callback();
		}

		function writeUint8Array(array, callback) {
			blob = new Blob([blob, appendABViewSupported ? array : array.buffer], {
				type: TEXT_PLAIN
			});
			callback();
		}

		function getData(callback, onerror) {
			var reader = new FileReader();
			reader.onload = function (e) {
				callback(e.target.result);
			};
			reader.onerror = onerror;
			reader.readAsText(blob, encoding);
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	TextWriter.prototype = new Writer();
	TextWriter.prototype.constructor = TextWriter;

	function Data64URIWriter(contentType) {
		var that = this,
		    data = "",
		    pending = "";

		function init(callback) {
			data += "data:" + (contentType || "") + ";base64,";
			callback();
		}

		function writeUint8Array(array, callback) {
			var i,
			    delta = pending.length,
			    dataString = pending;
			pending = "";
			for (i = 0; i < Math.floor((delta + array.length) / 3) * 3 - delta; i++) {
				dataString += String.fromCharCode(array[i]);
			}for (; i < array.length; i++) {
				pending += String.fromCharCode(array[i]);
			}if (dataString.length > 2) data += obj.btoa(dataString);else pending = dataString;
			callback();
		}

		function getData(callback) {
			callback(data + obj.btoa(pending));
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	Data64URIWriter.prototype = new Writer();
	Data64URIWriter.prototype.constructor = Data64URIWriter;

	function BlobWriter(contentType) {
		var blob,
		    that = this;

		function init(callback) {
			blob = new Blob([], {
				type: contentType
			});
			callback();
		}

		function writeUint8Array(array, callback) {
			blob = new Blob([blob, appendABViewSupported ? array : array.buffer], {
				type: contentType
			});
			callback();
		}

		function getData(callback) {
			callback(blob);
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	BlobWriter.prototype = new Writer();
	BlobWriter.prototype.constructor = BlobWriter;

	/** 
  * inflate/deflate core functions
  * @param worker {Worker} web worker for the task.
  * @param initialMessage {Object} initial message to be sent to the worker. should contain
  *   sn(serial number for distinguishing multiple tasks sent to the worker), and codecClass.
  *   This function may add more properties before sending.
  */
	function launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror) {
		var chunkIndex = 0,
		    index,
		    outputSize,
		    sn = initialMessage.sn,
		    crc;

		function onflush() {
			worker.removeEventListener('message', onmessage, false);
			onend(outputSize, crc);
		}

		function onmessage(event) {
			var message = event.data,
			    data = message.data,
			    err = message.error;
			if (err) {
				err.toString = function () {
					return 'Error: ' + this.message;
				};
				onreaderror(err);
				return;
			}
			if (message.sn !== sn) return;
			if (typeof message.codecTime === 'number') worker.codecTime += message.codecTime; // should be before onflush()
			if (typeof message.crcTime === 'number') worker.crcTime += message.crcTime;

			switch (message.type) {
				case 'append':
					if (data) {
						outputSize += data.length;
						writer.writeUint8Array(data, function () {
							step();
						}, onwriteerror);
					} else step();
					break;
				case 'flush':
					crc = message.crc;
					if (data) {
						outputSize += data.length;
						writer.writeUint8Array(data, function () {
							onflush();
						}, onwriteerror);
					} else onflush();
					break;
				case 'progress':
					if (onprogress) onprogress(index + message.loaded, size);
					break;
				case 'importScripts': //no need to handle here
				case 'newTask':
				case 'echo':
					break;
				default:
					console.warn('zip.js:launchWorkerProcess: unknown message: ', message);
			}
		}

		function step() {
			index = chunkIndex * CHUNK_SIZE;
			// use `<=` instead of `<`, because `size` may be 0.
			if (index <= size) {
				reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index), function (array) {
					if (onprogress) onprogress(index, size);
					var msg = index === 0 ? initialMessage : { sn: sn };
					msg.type = 'append';
					msg.data = array;

					// posting a message with transferables will fail on IE10
					try {
						worker.postMessage(msg, [array.buffer]);
					} catch (ex) {
						worker.postMessage(msg); // retry without transferables
					}
					chunkIndex++;
				}, onreaderror);
			} else {
				worker.postMessage({
					sn: sn,
					type: 'flush'
				});
			}
		}

		outputSize = 0;
		worker.addEventListener('message', onmessage, false);
		step();
	}

	function launchProcess(process, reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror) {
		var chunkIndex = 0,
		    index,
		    outputSize = 0,
		    crcInput = crcType === 'input',
		    crcOutput = crcType === 'output',
		    crc = new Crc32();
		function step() {
			var outputData;
			index = chunkIndex * CHUNK_SIZE;
			if (index < size) reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index), function (inputData) {
				var outputData;
				try {
					outputData = process.append(inputData, function (loaded) {
						if (onprogress) onprogress(index + loaded, size);
					});
				} catch (e) {
					onreaderror(e);
					return;
				}
				if (outputData) {
					outputSize += outputData.length;
					writer.writeUint8Array(outputData, function () {
						chunkIndex++;
						setTimeout(step, 1);
					}, onwriteerror);
					if (crcOutput) crc.append(outputData);
				} else {
					chunkIndex++;
					setTimeout(step, 1);
				}
				if (crcInput) crc.append(inputData);
				if (onprogress) onprogress(index, size);
			}, onreaderror);else {
				try {
					outputData = process.flush();
				} catch (e) {
					onreaderror(e);
					return;
				}
				if (outputData) {
					if (crcOutput) crc.append(outputData);
					outputSize += outputData.length;
					writer.writeUint8Array(outputData, function () {
						onend(outputSize, crc.get());
					}, onwriteerror);
				} else onend(outputSize, crc.get());
			}
		}

		step();
	}

	function inflate(worker, sn, reader, writer, offset, size, computeCrc32, onend, onprogress, onreaderror, onwriteerror) {
		var crcType = computeCrc32 ? 'output' : 'none';
		if (obj.zip.useWebWorkers) {
			var initialMessage = {
				sn: sn,
				codecClass: 'Inflater',
				crcType: crcType
			};
			launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror);
		} else launchProcess(new obj.zip.Inflater(), reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror);
	}

	function deflate(worker, sn, reader, writer, level, onend, onprogress, onreaderror, onwriteerror) {
		var crcType = 'input';
		if (obj.zip.useWebWorkers) {
			var initialMessage = {
				sn: sn,
				options: { level: level },
				codecClass: 'Deflater',
				crcType: crcType
			};
			launchWorkerProcess(worker, initialMessage, reader, writer, 0, reader.size, onprogress, onend, onreaderror, onwriteerror);
		} else launchProcess(new obj.zip.Deflater(), reader, writer, 0, reader.size, crcType, onprogress, onend, onreaderror, onwriteerror);
	}

	function copy(worker, sn, reader, writer, offset, size, computeCrc32, onend, onprogress, onreaderror, onwriteerror) {
		var crcType = 'input';
		if (obj.zip.useWebWorkers && computeCrc32) {
			var initialMessage = {
				sn: sn,
				codecClass: 'NOOP',
				crcType: crcType
			};
			launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror);
		} else launchProcess(new NOOP(), reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror);
	}

	// ZipReader

	function decodeASCII(str) {
		var i,
		    out = "",
		    charCode,
		    extendedASCII = ["Ç", "ü", "é", "â", "ä", "à", "å", "ç", "ê", "ë", "è", "ï", "î", "ì", "Ä", "Å", "É", "æ", "Æ", "ô", "ö", "ò", "û", "ù", "ÿ", "Ö", "Ü", "ø", "£", "Ø", "×", "ƒ", "á", "í", "ó", "ú", "ñ", "Ñ", "ª", "º", "¿", "®", "¬", "½", "¼", "¡", "«", "»", '_', '_', '_', "¦", "¦", "Á", "Â", "À", "©", "¦", "¦", '+', '+', "¢", "¥", '+', '+', '-', '-', '+', '-', '+', "ã", "Ã", '+', '+', '-', '-', "¦", '-', '+', "¤", "ð", "Ð", "Ê", "Ë", "È", 'i', "Í", "Î", "Ï", '+', '+', '_', '_', "¦", "Ì", '_', "Ó", "ß", "Ô", "Ò", "õ", "Õ", "µ", "þ", "Þ", "Ú", "Û", "Ù", "ý", "Ý", "¯", "´", "­", "±", '_', "¾", "¶", "§", "÷", "¸", "°", "¨", "·", "¹", "³", "²", '_', ' '];
		for (i = 0; i < str.length; i++) {
			charCode = str.charCodeAt(i) & 0xFF;
			if (charCode > 127) out += extendedASCII[charCode - 128];else out += String.fromCharCode(charCode);
		}
		return out;
	}

	function decodeUTF8(string) {
		return decodeURIComponent(escape(string));
	}

	function getString(bytes) {
		var i,
		    str = "";
		for (i = 0; i < bytes.length; i++) {
			str += String.fromCharCode(bytes[i]);
		}return str;
	}

	function getDate(timeRaw) {
		var date = (timeRaw & 0xffff0000) >> 16,
		    time = timeRaw & 0x0000ffff;
		try {
			return new Date(1980 + ((date & 0xFE00) >> 9), ((date & 0x01E0) >> 5) - 1, date & 0x001F, (time & 0xF800) >> 11, (time & 0x07E0) >> 5, (time & 0x001F) * 2, 0);
		} catch (e) {}
	}

	function readCommonHeader(entry, data, index, centralDirectory, onerror) {
		entry.version = data.view.getUint16(index, true);
		entry.bitFlag = data.view.getUint16(index + 2, true);
		entry.compressionMethod = data.view.getUint16(index + 4, true);
		entry.lastModDateRaw = data.view.getUint32(index + 6, true);
		entry.lastModDate = getDate(entry.lastModDateRaw);
		if ((entry.bitFlag & 0x01) === 0x01) {
			onerror(ERR_ENCRYPTED);
			return;
		}
		if (centralDirectory || (entry.bitFlag & 0x0008) != 0x0008) {
			entry.crc32 = data.view.getUint32(index + 10, true);
			entry.compressedSize = data.view.getUint32(index + 14, true);
			entry.uncompressedSize = data.view.getUint32(index + 18, true);
		}
		if (entry.compressedSize === 0xFFFFFFFF || entry.uncompressedSize === 0xFFFFFFFF) {
			onerror(ERR_ZIP64);
			return;
		}
		entry.filenameLength = data.view.getUint16(index + 22, true);
		entry.extraFieldLength = data.view.getUint16(index + 24, true);
	}

	function createZipReader(reader, callback, onerror) {
		var inflateSN = 0;

		function Entry() {}

		Entry.prototype.getData = function (writer, onend, onprogress, checkCrc32) {
			var that = this;

			function testCrc32(crc32) {
				var dataCrc32 = getDataHelper(4);
				dataCrc32.view.setUint32(0, crc32);
				return that.crc32 == dataCrc32.view.getUint32(0);
			}

			function getWriterData(uncompressedSize, crc32) {
				if (checkCrc32 && !testCrc32(crc32)) onerror(ERR_CRC);else writer.getData(function (data) {
					onend(data);
				});
			}

			function onreaderror(err) {
				onerror(err || ERR_READ_DATA);
			}

			function onwriteerror(err) {
				onerror(err || ERR_WRITE_DATA);
			}

			reader.readUint8Array(that.offset, 30, function (bytes) {
				var data = getDataHelper(bytes.length, bytes),
				    dataOffset;
				if (data.view.getUint32(0) != 0x504b0304) {
					onerror(ERR_BAD_FORMAT);
					return;
				}
				readCommonHeader(that, data, 4, false, onerror);
				dataOffset = that.offset + 30 + that.filenameLength + that.extraFieldLength;
				writer.init(function () {
					if (that.compressionMethod === 0) copy(that._worker, inflateSN++, reader, writer, dataOffset, that.compressedSize, checkCrc32, getWriterData, onprogress, onreaderror, onwriteerror);else inflate(that._worker, inflateSN++, reader, writer, dataOffset, that.compressedSize, checkCrc32, getWriterData, onprogress, onreaderror, onwriteerror);
				}, onwriteerror);
			}, onreaderror);
		};

		function seekEOCDR(eocdrCallback) {
			// "End of central directory record" is the last part of a zip archive, and is at least 22 bytes long.
			// Zip file comment is the last part of EOCDR and has max length of 64KB,
			// so we only have to search the last 64K + 22 bytes of a archive for EOCDR signature (0x06054b50).
			var EOCDR_MIN = 22;
			if (reader.size < EOCDR_MIN) {
				onerror(ERR_BAD_FORMAT);
				return;
			}
			var ZIP_COMMENT_MAX = 256 * 256,
			    EOCDR_MAX = EOCDR_MIN + ZIP_COMMENT_MAX;

			// In most cases, the EOCDR is EOCDR_MIN bytes long
			doSeek(EOCDR_MIN, function () {
				// If not found, try within EOCDR_MAX bytes
				doSeek(Math.min(EOCDR_MAX, reader.size), function () {
					onerror(ERR_BAD_FORMAT);
				});
			});

			// seek last length bytes of file for EOCDR
			function doSeek(length, eocdrNotFoundCallback) {
				reader.readUint8Array(reader.size - length, length, function (bytes) {
					for (var i = bytes.length - EOCDR_MIN; i >= 0; i--) {
						if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
							eocdrCallback(new DataView(bytes.buffer, i, EOCDR_MIN));
							return;
						}
					}
					eocdrNotFoundCallback();
				}, function () {
					onerror(ERR_READ);
				});
			}
		}

		var zipReader = {
			getEntries: function getEntries(callback) {
				var worker = this._worker;
				// look for End of central directory record
				seekEOCDR(function (dataView) {
					var datalength, fileslength;
					datalength = dataView.getUint32(16, true);
					fileslength = dataView.getUint16(8, true);
					if (datalength < 0 || datalength >= reader.size) {
						onerror(ERR_BAD_FORMAT);
						return;
					}
					reader.readUint8Array(datalength, reader.size - datalength, function (bytes) {
						var i,
						    index = 0,
						    entries = [],
						    entry,
						    filename,
						    comment,
						    data = getDataHelper(bytes.length, bytes);
						for (i = 0; i < fileslength; i++) {
							entry = new Entry();
							entry._worker = worker;
							if (data.view.getUint32(index) != 0x504b0102) {
								onerror(ERR_BAD_FORMAT);
								return;
							}
							readCommonHeader(entry, data, index + 6, true, onerror);
							entry.commentLength = data.view.getUint16(index + 32, true);
							entry.directory = (data.view.getUint8(index + 38) & 0x10) == 0x10;
							entry.offset = data.view.getUint32(index + 42, true);
							filename = getString(data.array.subarray(index + 46, index + 46 + entry.filenameLength));
							entry.filename = (entry.bitFlag & 0x0800) === 0x0800 ? decodeUTF8(filename) : decodeASCII(filename);
							if (!entry.directory && entry.filename.charAt(entry.filename.length - 1) == "/") entry.directory = true;
							comment = getString(data.array.subarray(index + 46 + entry.filenameLength + entry.extraFieldLength, index + 46 + entry.filenameLength + entry.extraFieldLength + entry.commentLength));
							entry.comment = (entry.bitFlag & 0x0800) === 0x0800 ? decodeUTF8(comment) : decodeASCII(comment);
							entries.push(entry);
							index += 46 + entry.filenameLength + entry.extraFieldLength + entry.commentLength;
						}
						callback(entries);
					}, function () {
						onerror(ERR_READ);
					});
				});
			},
			close: function close(callback) {
				if (this._worker) {
					this._worker.terminate();
					this._worker = null;
				}
				if (callback) callback();
			},
			_worker: null
		};

		if (!obj.zip.useWebWorkers) callback(zipReader);else {
			createWorker('inflater', function (worker) {
				zipReader._worker = worker;
				callback(zipReader);
			}, function (err) {
				onerror(err);
			});
		}
	}

	// ZipWriter

	function encodeUTF8(string) {
		return unescape(encodeURIComponent(string));
	}

	function getBytes(str) {
		var i,
		    array = [];
		for (i = 0; i < str.length; i++) {
			array.push(str.charCodeAt(i));
		}return array;
	}

	function createZipWriter(writer, callback, onerror, dontDeflate) {
		var files = {},
		    filenames = [],
		    datalength = 0;
		var deflateSN = 0;

		function onwriteerror(err) {
			onerror(err || ERR_WRITE);
		}

		function onreaderror(err) {
			onerror(err || ERR_READ_DATA);
		}

		var zipWriter = {
			add: function add(name, reader, onend, onprogress, options) {
				var header, filename, date;
				var worker = this._worker;

				function writeHeader(callback) {
					var data;
					date = options.lastModDate || new Date();
					header = getDataHelper(26);
					files[name] = {
						headerArray: header.array,
						directory: options.directory,
						filename: filename,
						offset: datalength,
						comment: getBytes(encodeUTF8(options.comment || ""))
					};
					header.view.setUint32(0, 0x14000808);
					if (options.version) header.view.setUint8(0, options.version);
					if (!dontDeflate && options.level !== 0 && !options.directory) header.view.setUint16(4, 0x0800);
					header.view.setUint16(6, (date.getHours() << 6 | date.getMinutes()) << 5 | date.getSeconds() / 2, true);
					header.view.setUint16(8, (date.getFullYear() - 1980 << 4 | date.getMonth() + 1) << 5 | date.getDate(), true);
					header.view.setUint16(22, filename.length, true);
					data = getDataHelper(30 + filename.length);
					data.view.setUint32(0, 0x504b0304);
					data.array.set(header.array, 4);
					data.array.set(filename, 30);
					datalength += data.array.length;
					writer.writeUint8Array(data.array, callback, onwriteerror);
				}

				function writeFooter(compressedLength, crc32) {
					var footer = getDataHelper(16);
					datalength += compressedLength || 0;
					footer.view.setUint32(0, 0x504b0708);
					if (typeof crc32 != "undefined") {
						header.view.setUint32(10, crc32, true);
						footer.view.setUint32(4, crc32, true);
					}
					if (reader) {
						footer.view.setUint32(8, compressedLength, true);
						header.view.setUint32(14, compressedLength, true);
						footer.view.setUint32(12, reader.size, true);
						header.view.setUint32(18, reader.size, true);
					}
					writer.writeUint8Array(footer.array, function () {
						datalength += 16;
						onend();
					}, onwriteerror);
				}

				function writeFile() {
					options = options || {};
					name = name.trim();
					if (options.directory && name.charAt(name.length - 1) != "/") name += "/";
					if (files.hasOwnProperty(name)) {
						onerror(ERR_DUPLICATED_NAME);
						return;
					}
					filename = getBytes(encodeUTF8(name));
					filenames.push(name);
					writeHeader(function () {
						if (reader) {
							if (dontDeflate || options.level === 0) copy(worker, deflateSN++, reader, writer, 0, reader.size, true, writeFooter, onprogress, onreaderror, onwriteerror);else deflate(worker, deflateSN++, reader, writer, options.level, writeFooter, onprogress, onreaderror, onwriteerror);
						} else writeFooter();
					}, onwriteerror);
				}

				if (reader) reader.init(writeFile, onreaderror);else writeFile();
			},
			close: function close(callback) {
				if (this._worker) {
					this._worker.terminate();
					this._worker = null;
				}

				var data,
				    length = 0,
				    index = 0,
				    indexFilename,
				    file;
				for (indexFilename = 0; indexFilename < filenames.length; indexFilename++) {
					file = files[filenames[indexFilename]];
					length += 46 + file.filename.length + file.comment.length;
				}
				data = getDataHelper(length + 22);
				for (indexFilename = 0; indexFilename < filenames.length; indexFilename++) {
					file = files[filenames[indexFilename]];
					data.view.setUint32(index, 0x504b0102);
					data.view.setUint16(index + 4, 0x1400);
					data.array.set(file.headerArray, index + 6);
					data.view.setUint16(index + 32, file.comment.length, true);
					if (file.directory) data.view.setUint8(index + 38, 0x10);
					data.view.setUint32(index + 42, file.offset, true);
					data.array.set(file.filename, index + 46);
					data.array.set(file.comment, index + 46 + file.filename.length);
					index += 46 + file.filename.length + file.comment.length;
				}
				data.view.setUint32(index, 0x504b0506);
				data.view.setUint16(index + 8, filenames.length, true);
				data.view.setUint16(index + 10, filenames.length, true);
				data.view.setUint32(index + 12, length, true);
				data.view.setUint32(index + 16, datalength, true);
				writer.writeUint8Array(data.array, function () {
					writer.getData(callback);
				}, onwriteerror);
			},
			_worker: null
		};

		if (!obj.zip.useWebWorkers) callback(zipWriter);else {
			createWorker('deflater', function (worker) {
				zipWriter._worker = worker;
				callback(zipWriter);
			}, function (err) {
				onerror(err);
			});
		}
	}

	function resolveURLs(urls) {
		var a = document.createElement('a');
		return urls.map(function (url) {
			a.href = url;
			return a.href;
		});
	}

	var DEFAULT_WORKER_SCRIPTS = {
		deflater: ['z-worker.js', 'deflate.js'],
		inflater: ['z-worker.js', 'inflate.js']
	};
	function createWorker(type, callback, onerror) {
		if (obj.zip.workerScripts !== null && obj.zip.workerScriptsPath !== null) {
			onerror(new Error('Either zip.workerScripts or zip.workerScriptsPath may be set, not both.'));
			return;
		}
		var scripts;
		if (obj.zip.workerScripts) {
			scripts = obj.zip.workerScripts[type];
			if (!Array.isArray(scripts)) {
				onerror(new Error('zip.workerScripts.' + type + ' is not an array!'));
				return;
			}
			scripts = resolveURLs(scripts);
		} else {
			scripts = DEFAULT_WORKER_SCRIPTS[type].slice(0);
			scripts[0] = (obj.zip.workerScriptsPath || '') + scripts[0];
		}
		var worker = new Worker(scripts[0]);
		// record total consumed time by inflater/deflater/crc32 in this worker
		worker.codecTime = worker.crcTime = 0;
		worker.postMessage({ type: 'importScripts', scripts: scripts.slice(1) });
		worker.addEventListener('message', onmessage);
		function onmessage(ev) {
			var msg = ev.data;
			if (msg.error) {
				worker.terminate(); // should before onerror(), because onerror() may throw.
				onerror(msg.error);
				return;
			}
			if (msg.type === 'importScripts') {
				worker.removeEventListener('message', onmessage);
				worker.removeEventListener('error', errorHandler);
				callback(worker);
			}
		}
		// catch entry script loading error and other unhandled errors
		worker.addEventListener('error', errorHandler);
		function errorHandler(err) {
			worker.terminate();
			onerror(err);
		}
	}

	function onerror_default(error) {
		console.error(error);
	}
	obj.zip = {
		Reader: Reader,
		Writer: Writer,
		BlobReader: BlobReader,
		Data64URIReader: Data64URIReader,
		TextReader: TextReader,
		BlobWriter: BlobWriter,
		Data64URIWriter: Data64URIWriter,
		TextWriter: TextWriter,
		createReader: function createReader(reader, callback, onerror) {
			onerror = onerror || onerror_default;

			reader.init(function () {
				createZipReader(reader, callback, onerror);
			}, onerror);
		},
		createWriter: function createWriter(writer, callback, onerror, dontDeflate) {
			onerror = onerror || onerror_default;
			dontDeflate = !!dontDeflate;

			writer.init(function () {
				createZipWriter(writer, callback, onerror, dontDeflate);
			}, onerror);
		},
		useWebWorkers: true,
		/**
   * Directory containing the default worker scripts (z-worker.js, deflate.js, and inflate.js), relative to current base url.
   * E.g.: zip.workerScripts = './';
   */
		workerScriptsPath: null,
		/**
   * Advanced option to control which scripts are loaded in the Web worker. If this option is specified, then workerScriptsPath must not be set.
   * workerScripts.deflater/workerScripts.inflater should be arrays of urls to scripts for deflater/inflater, respectively.
   * Scripts in the array are executed in order, and the first one should be z-worker.js, which is used to start the worker.
   * All urls are relative to current base url.
   * E.g.:
   * zip.workerScripts = {
   *   deflater: ['z-worker.js', 'deflate.js'],
   *   inflater: ['z-worker.js', 'inflate.js']
   * };
   */
		workerScripts: null
	};
})(this);

zip.workerScripts = {
  deflater: ['lib/z-worker.js', 'lib/pako_deflate.min.js', 'lib/pako/codecs.js'],
  inflater: ['lib/z-worker.js', 'lib/pako_inflate.min.js', 'lib/pako/codecs.js']
};

function wrapZip(zipFile) {
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

function wrapWriter(writer) {
  return new Promise(function (resolve, reject) {
    zip.createWriter(writer, resolve, reject);
  });
}

function createWriter() {
  return wrapWriter(new zip.BlobWriter('application/epub+zip')).then(function (zip) {
    return wrapZip(zip);
  });
}

function text(text) {
  return new zip.TextReader(text);
}

function blob(blob) {
  return new zip.BlobReader(blob);
}

function get(URL) {
  return new zip.HttpReader(URL);
}

var zip$1 = Object.freeze({
  createWriter: createWriter,
  text: text,
  blob: blob,
  get: get
});

var BmBook = function (_HTMLElement) {
  babelHelpers.inherits(BmBook, _HTMLElement);

  function BmBook() {
    babelHelpers.classCallCheck(this, BmBook);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BmBook).apply(this, arguments));
  }

  babelHelpers.createClass(BmBook, [{
    key: "createdCallback",
    value: function createdCallback() {}
  }, {
    key: "attachedCallback",
    value: function attachedCallback() {}
  }, {
    key: "detachedCallback",
    value: function detachedCallback() {}
  }, {
    key: "attributeChangedCallback",
    value: function attributeChangedCallback() {}
  }]);
  return BmBook;
}(HTMLElement);

var BmChapterBody = function (_HTMLElement) {
  babelHelpers.inherits(BmChapterBody, _HTMLElement);

  function BmChapterBody() {
    babelHelpers.classCallCheck(this, BmChapterBody);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BmChapterBody).apply(this, arguments));
  }

  babelHelpers.createClass(BmChapterBody, [{
    key: "createdCallback",
    value: function createdCallback() {}
  }, {
    key: "attachedCallback",
    value: function attachedCallback() {}
  }, {
    key: "detachedCallback",
    value: function detachedCallback() {}
  }, {
    key: "attributeChangedCallback",
    value: function attributeChangedCallback() {}
  }]);
  return BmChapterBody;
}(HTMLElement);

var BmCover = function (_HTMLElement) {
  babelHelpers.inherits(BmCover, _HTMLElement);

  function BmCover() {
    babelHelpers.classCallCheck(this, BmCover);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BmCover).apply(this, arguments));
  }

  babelHelpers.createClass(BmCover, [{
    key: "createdCallback",
    value: function createdCallback() {}
  }, {
    key: "attachedCallback",
    value: function attachedCallback() {}
  }, {
    key: "detachedCallback",
    value: function detachedCallback() {}
  }, {
    key: "attributeChangedCallback",
    value: function attributeChangedCallback() {}
  }]);
  return BmCover;
}(HTMLElement);

var BmChapter = function (_HTMLElement) {
  babelHelpers.inherits(BmChapter, _HTMLElement);

  function BmChapter() {
    babelHelpers.classCallCheck(this, BmChapter);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BmChapter).apply(this, arguments));
  }

  babelHelpers.createClass(BmChapter, [{
    key: "createdCallback",
    value: function createdCallback() {}
  }, {
    key: "attachedCallback",
    value: function attachedCallback() {}
  }, {
    key: "detachedCallback",
    value: function detachedCallback() {}
  }, {
    key: "attributeChangedCallback",
    value: function attributeChangedCallback() {}
  }]);
  return BmChapter;
}(HTMLElement);

var BmChapterBody$1 = function (_HTMLElement) {
  babelHelpers.inherits(BmChapterBody, _HTMLElement);

  function BmChapterBody() {
    babelHelpers.classCallCheck(this, BmChapterBody);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BmChapterBody).apply(this, arguments));
  }

  babelHelpers.createClass(BmChapterBody, [{
    key: "createdCallback",
    value: function createdCallback() {}
  }, {
    key: "attachedCallback",
    value: function attachedCallback() {}
  }, {
    key: "detachedCallback",
    value: function detachedCallback() {}
  }, {
    key: "attributeChangedCallback",
    value: function attributeChangedCallback() {}
  }]);
  return BmChapterBody;
}(HTMLElement);

var bmElements = {
  BmBook: document.registerElement('bm-book', BmBook),
  BmBookBody: document.registerElement('bm-book-body', BmChapterBody),
  BmCover: document.registerElement('bm-cover', BmCover),
  BmChapter: document.registerElement('bm-chapter', BmChapter),
  BmChapterBody: document.registerElement('bm-chapter-body', BmChapterBody$1)
};

console.log(zip$1);

export default bmElements;
//# sourceMappingURL=index.es6.js.map