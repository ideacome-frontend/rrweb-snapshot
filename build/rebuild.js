"use strict";
exports.__esModule = true;
exports.buildNodeWithSN = exports.addHoverClass = void 0;
var css_1 = require("./css");
var types_1 = require("./types");
var tagMap = {
    script: 'noscript',
    altglyph: 'altGlyph',
    altglyphdef: 'altGlyphDef',
    altglyphitem: 'altGlyphItem',
    animatecolor: 'animateColor',
    animatemotion: 'animateMotion',
    animatetransform: 'animateTransform',
    clippath: 'clipPath',
    feblend: 'feBlend',
    fecolormatrix: 'feColorMatrix',
    fecomponenttransfer: 'feComponentTransfer',
    fecomposite: 'feComposite',
    feconvolvematrix: 'feConvolveMatrix',
    fediffuselighting: 'feDiffuseLighting',
    fedisplacementmap: 'feDisplacementMap',
    fedistantlight: 'feDistantLight',
    fedropshadow: 'feDropShadow',
    feflood: 'feFlood',
    fefunca: 'feFuncA',
    fefuncb: 'feFuncB',
    fefuncg: 'feFuncG',
    fefuncr: 'feFuncR',
    fegaussianblur: 'feGaussianBlur',
    feimage: 'feImage',
    femerge: 'feMerge',
    femergenode: 'feMergeNode',
    femorphology: 'feMorphology',
    feoffset: 'feOffset',
    fepointlight: 'fePointLight',
    fespecularlighting: 'feSpecularLighting',
    fespotlight: 'feSpotLight',
    fetile: 'feTile',
    feturbulence: 'feTurbulence',
    foreignobject: 'foreignObject',
    glyphref: 'glyphRef',
    lineargradient: 'linearGradient',
    radialgradient: 'radialGradient'
};
function getTagName(n) {
    var tagName = tagMap[n.tagName] ? tagMap[n.tagName] : n.tagName;
    if (tagName === 'link' && n.attributes._cssText) {
        tagName = 'style';
    }
    return tagName;
}
var HOVER_SELECTOR = /([^\\]):hover/g;
function addHoverClass(cssText) {
    var ast = css_1.parse(cssText, { silent: true });
    if (!ast.stylesheet) {
        return cssText;
    }
    ast.stylesheet.rules.forEach(function (rule) {
        if ('selectors' in rule) {
            (rule.selectors || []).forEach(function (selector) {
                if (HOVER_SELECTOR.test(selector)) {
                    var newSelector = selector.replace(HOVER_SELECTOR, '$1.\\:hover');
                    cssText = cssText.replace(selector, selector + ", " + newSelector);
                }
            });
        }
    });
    return cssText;
}
exports.addHoverClass = addHoverClass;
function buildNode(n, doc, HACK_CSS) {
    switch (n.type) {
        case types_1.NodeType.Document:
            return doc.implementation.createDocument(null, '', null);
        case types_1.NodeType.DocumentType:
            return doc.implementation.createDocumentType(n.name, n.publicId, n.systemId);
        case types_1.NodeType.Element:
            var tagName = getTagName(n);
            var node_1;
            if (n.isSVG) {
                node_1 = doc.createElementNS('http://www.w3.org/2000/svg', tagName);
            }
            else {
                node_1 = doc.createElement(tagName);
            }
            var _loop_1 = function (name_1) {
                if (!n.attributes.hasOwnProperty(name_1)) {
                    return "continue";
                }
                var value = n.attributes[name_1];
                value =
                    typeof value === 'boolean' || typeof value === 'number' ? '' : value;
                if (!name_1.startsWith('rr_')) {
                    var isTextarea = tagName === 'textarea' && name_1 === 'value';
                    var isRemoteOrDynamicCss = tagName === 'style' && name_1 === '_cssText';
                    if (isRemoteOrDynamicCss && HACK_CSS) {
                        value = addHoverClass(value);
                    }
                    if (isTextarea || isRemoteOrDynamicCss) {
                        var child = doc.createTextNode(value);
                        for (var _i = 0, _a = Array.from(node_1.childNodes); _i < _a.length; _i++) {
                            var c = _a[_i];
                            if (c.nodeType === node_1.TEXT_NODE) {
                                node_1.removeChild(c);
                            }
                        }
                        node_1.appendChild(child);
                        return "continue";
                    }
                    try {
                        if (n.isSVG && name_1 === 'xlink:href') {
                            node_1.setAttributeNS('http://www.w3.org/1999/xlink', name_1, value);
                        }
                        else if (name_1 === 'onload' ||
                            name_1 === 'onclick' ||
                            name_1.substring(0, 7) === 'onmouse') {
                            node_1.setAttribute('_' + name_1, value);
                        }
                        else {
                            node_1.setAttribute(name_1, value);
                        }
                    }
                    catch (error) {
                    }
                }
                else {
                    if (tagName === 'canvas' && name_1 === 'rr_dataURL') {
                        var image_1 = document.createElement('img');
                        image_1.src = value;
                        image_1.onload = function () {
                            var ctx = node_1.getContext('2d');
                            if (ctx) {
                                ctx.drawImage(image_1, 0, 0, image_1.width, image_1.height);
                            }
                        };
                    }
                    if (name_1 === 'rr_width') {
                        node_1.style.width = value;
                    }
                    if (name_1 === 'rr_height') {
                        node_1.style.height = value;
                    }
                    if (name_1 === 'rr_mediaState') {
                        switch (value) {
                            case 'played':
                                node_1.play();
                            case 'paused':
                                node_1.pause();
                                break;
                            default:
                        }
                    }
                }
            };
            for (var name_1 in n.attributes) {
                _loop_1(name_1);
            }
            return node_1;
        case types_1.NodeType.Text:
            return doc.createTextNode(n.isStyle && HACK_CSS ? addHoverClass(n.textContent) : n.textContent);
        case types_1.NodeType.CDATA:
            return doc.createCDATASection(n.textContent);
        case types_1.NodeType.Comment:
            return doc.createComment(n.textContent);
        default:
            return null;
    }
}
function buildNodeWithSN(n, doc, map, skipChild, HACK_CSS) {
    if (skipChild === void 0) { skipChild = false; }
    if (HACK_CSS === void 0) { HACK_CSS = true; }
    var node = buildNode(n, doc, HACK_CSS);
    if (!node) {
        return null;
    }
    if (n.type === types_1.NodeType.Document) {
        doc.close();
        doc.open();
        node = doc;
    }
    node.__sn = n;
    map[n.id] = node;
    if ((n.type === types_1.NodeType.Document || n.type === types_1.NodeType.Element) &&
        !skipChild) {
        for (var _i = 0, _a = n.childNodes; _i < _a.length; _i++) {
            var childN = _a[_i];
            var childNode = buildNodeWithSN(childN, doc, map, false, HACK_CSS);
            if (!childNode) {
                console.warn('Failed to rebuild', childN);
            }
            else {
                node.appendChild(childNode);
            }
        }
    }
    return node;
}
exports.buildNodeWithSN = buildNodeWithSN;
function visit(idNodeMap, onVisit) {
    function walk(node) {
        onVisit(node);
    }
    for (var key in idNodeMap) {
        if (idNodeMap[key]) {
            walk(idNodeMap[key]);
        }
    }
}
function handleScroll(node) {
    var n = node.__sn;
    if (n.type !== types_1.NodeType.Element) {
        return;
    }
    var el = node;
    for (var name_2 in n.attributes) {
        if (!(n.attributes.hasOwnProperty(name_2) && name_2.startsWith('rr_'))) {
            continue;
        }
        var value = n.attributes[name_2];
        if (name_2 === 'rr_scrollLeft') {
            el.scrollLeft = value;
        }
        if (name_2 === 'rr_scrollTop') {
            el.scrollTop = value;
        }
    }
}
function rebuild(n, doc, onVisit, HACK_CSS) {
    if (HACK_CSS === void 0) { HACK_CSS = true; }
    var idNodeMap = {};
    var node = buildNodeWithSN(n, doc, idNodeMap, false, HACK_CSS);
    visit(idNodeMap, function (visitedNode) {
        if (onVisit) {
            onVisit(visitedNode);
        }
        handleScroll(visitedNode);
    });
    return [node, idNodeMap];
}
exports["default"] = rebuild;
//# sourceMappingURL=rebuild.js.map