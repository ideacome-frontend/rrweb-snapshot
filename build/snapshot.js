"use strict";
exports.__esModule = true;
exports.visitSnapshot = exports.serializeNodeWithId = exports.transformAttribute = exports.absoluteToDoc = exports.absoluteToStylesheet = void 0;
var types_1 = require("./types");
var _id = 1;
var tagNameRegex = RegExp('[^a-z1-6-_]');
function genId() {
    return _id++;
}
function getValidTagName(tagName) {
    var processedTagName = tagName.toLowerCase().trim();
    if (tagNameRegex.test(processedTagName)) {
        return 'div';
    }
    return processedTagName;
}
function getCssRulesString(s) {
    try {
        var rules = s.rules || s.cssRules;
        return rules
            ? Array.from(rules).reduce(function (prev, cur) { return prev + getCssRuleString(cur); }, '')
            : null;
    }
    catch (error) {
        return null;
    }
}
function getCssRuleString(rule) {
    return isCSSImportRule(rule)
        ? getCssRulesString(rule.styleSheet) || ''
        : rule.cssText;
}
function isCSSImportRule(rule) {
    return 'styleSheet' in rule;
}
function extractOrigin(url) {
    var origin;
    if (url.indexOf('//') > -1) {
        origin = url.split('/').slice(0, 3).join('/');
    }
    else {
        origin = url.split('/')[0];
    }
    origin = origin.split('?')[0];
    return origin;
}
var URL_IN_CSS_REF = /url\((?:'([^']*)'|"([^"]*)"|([^)]*))\)/gm;
var RELATIVE_PATH = /^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\\|\/\/).*/;
var DATA_URI = /^(data:)([\w\/\+\-]+);(charset=[\w-]+|base64).*,(.*)/i;
function absoluteToStylesheet(cssText, href) {
    return (cssText || '').replace(URL_IN_CSS_REF, function (origin, path1, path2, path3) {
        var filePath = path1 || path2 || path3;
        if (!filePath) {
            return origin;
        }
        if (!RELATIVE_PATH.test(filePath)) {
            return "url('" + filePath + "')";
        }
        if (DATA_URI.test(filePath)) {
            return "url(" + filePath + ")";
        }
        if (filePath[0] === '/') {
            return "url('" + (extractOrigin(href) + filePath) + "')";
        }
        var stack = href.split('/');
        var parts = filePath.split('/');
        stack.pop();
        for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
            var part = parts_1[_i];
            if (part === '.') {
                continue;
            }
            else if (part === '..') {
                stack.pop();
            }
            else {
                stack.push(part);
            }
        }
        return "url('" + stack.join('/') + "')";
    });
}
exports.absoluteToStylesheet = absoluteToStylesheet;
function getAbsoluteSrcsetString(doc, attributeValue) {
    if (attributeValue.trim() === '') {
        return attributeValue;
    }
    var srcsetValues = attributeValue.split(',');
    var resultingSrcsetString = srcsetValues
        .map(function (srcItem) {
        var trimmedSrcItem = srcItem.trimLeft().trimRight();
        var urlAndSize = trimmedSrcItem.split(' ');
        if (urlAndSize.length === 2) {
            var absUrl = absoluteToDoc(doc, urlAndSize[0]);
            return absUrl + " " + urlAndSize[1];
        }
        else if (urlAndSize.length === 1) {
            var absUrl = absoluteToDoc(doc, urlAndSize[0]);
            return "" + absUrl;
        }
        return '';
    })
        .join(', ');
    return resultingSrcsetString;
}
function absoluteToDoc(doc, attributeValue) {
    if (!attributeValue || attributeValue.trim() === '') {
        return attributeValue;
    }
    var a = doc.createElement('a');
    a.href = attributeValue;
    return a.href;
}
exports.absoluteToDoc = absoluteToDoc;
function isSVGElement(el) {
    return el.tagName === 'svg' || el instanceof SVGElement;
}
function transformAttribute(doc, name, value) {
    if (name === 'src' || (name === 'href' && value)) {
        return absoluteToDoc(doc, value);
    }
    else if (name === 'srcset' && value) {
        return getAbsoluteSrcsetString(doc, value);
    }
    else if (name === 'style' && value) {
        return absoluteToStylesheet(value, location.href);
    }
    else {
        return value;
    }
}
exports.transformAttribute = transformAttribute;
function serializeNode(n, doc, blockClass, inlineStylesheet, maskInputOptions, recordCanvas) {
    if (maskInputOptions === void 0) { maskInputOptions = {}; }
    switch (n.nodeType) {
        case n.DOCUMENT_NODE:
            return {
                type: types_1.NodeType.Document,
                childNodes: []
            };
        case n.DOCUMENT_TYPE_NODE:
            return {
                type: types_1.NodeType.DocumentType,
                name: n.name,
                publicId: n.publicId,
                systemId: n.systemId
            };
        case n.ELEMENT_NODE:
            var needBlock_1 = false;
            if (typeof blockClass === 'string') {
                needBlock_1 = n.classList.contains(blockClass);
            }
            else {
                n.classList.forEach(function (className) {
                    if (blockClass.test(className)) {
                        needBlock_1 = true;
                    }
                });
            }
            var tagName = getValidTagName(n.tagName);
            var attributes = {};
            for (var _i = 0, _a = Array.from(n.attributes); _i < _a.length; _i++) {
                var _b = _a[_i], name_1 = _b.name, value = _b.value;
                attributes[name_1] = transformAttribute(doc, name_1, value);
            }
            if (tagName === 'link' && inlineStylesheet) {
                var stylesheet = Array.from(doc.styleSheets).find(function (s) {
                    return s.href === n.href;
                });
                var cssText = getCssRulesString(stylesheet);
                if (cssText) {
                    delete attributes.rel;
                    delete attributes.href;
                    attributes._cssText = absoluteToStylesheet(cssText, stylesheet.href);
                }
            }
            if (tagName === 'style' &&
                n.sheet &&
                !(n.innerText ||
                    n.textContent ||
                    '').trim().length) {
                var cssText = getCssRulesString(n.sheet);
                if (cssText) {
                    attributes._cssText = absoluteToStylesheet(cssText, location.href);
                }
            }
            if (tagName === 'input' ||
                tagName === 'textarea' ||
                tagName === 'select') {
                var value = n.value;
                if (attributes.type !== 'radio' &&
                    attributes.type !== 'checkbox' &&
                    attributes.type !== 'submit' &&
                    attributes.type !== 'button' &&
                    value) {
                    attributes.value =
                        maskInputOptions[attributes.type] ||
                            maskInputOptions[tagName]
                            ? '*'.repeat(value.length)
                            : value;
                }
                else if (n.checked) {
                    attributes.checked = n.checked;
                }
            }
            if (tagName === 'option') {
                var selectValue = n.parentElement;
                if (attributes.value === selectValue.value) {
                    attributes.selected = n.selected;
                }
            }
            if (tagName === 'canvas' && recordCanvas) {
                attributes.rr_dataURL = n.toDataURL();
            }
            if (tagName === 'audio' || tagName === 'video') {
                attributes.rr_mediaState = n.paused
                    ? 'paused'
                    : 'played';
            }
            if (n.scrollLeft) {
                attributes.rr_scrollLeft = n.scrollLeft;
            }
            if (n.scrollTop) {
                attributes.rr_scrollTop = n.scrollTop;
            }
            if (needBlock_1) {
                var _c = n.getBoundingClientRect(), width = _c.width, height = _c.height;
                attributes.rr_width = width + "px";
                attributes.rr_height = height + "px";
            }
            return {
                type: types_1.NodeType.Element,
                tagName: tagName,
                attributes: attributes,
                childNodes: [],
                isSVG: isSVGElement(n) || undefined,
                needBlock: needBlock_1
            };
        case n.TEXT_NODE:
            var parentTagName = n.parentNode && n.parentNode.tagName;
            var textContent = n.textContent;
            var isStyle = parentTagName === 'STYLE' ? true : undefined;
            if (isStyle && textContent) {
                textContent = absoluteToStylesheet(textContent, location.href);
            }
            if (parentTagName === 'SCRIPT') {
                textContent = 'SCRIPT_PLACEHOLDER';
            }
            return {
                type: types_1.NodeType.Text,
                textContent: textContent || '',
                isStyle: isStyle
            };
        case n.CDATA_SECTION_NODE:
            return {
                type: types_1.NodeType.CDATA,
                textContent: ''
            };
        case n.COMMENT_NODE:
            return {
                type: types_1.NodeType.Comment,
                textContent: n.textContent || ''
            };
        default:
            return false;
    }
}
function serializeNodeWithId(n, doc, map, blockClass, skipChild, inlineStylesheet, maskInputOptions, recordCanvas) {
    if (skipChild === void 0) { skipChild = false; }
    if (inlineStylesheet === void 0) { inlineStylesheet = true; }
    var _serializedNode = serializeNode(n, doc, blockClass, inlineStylesheet, maskInputOptions, recordCanvas || false);
    if (!_serializedNode) {
        console.warn(n, 'not serialized');
        return null;
    }
    var id;
    if ('__sn' in n) {
        id = n.__sn.id;
    }
    else {
        id = genId();
    }
    var serializedNode = Object.assign(_serializedNode, { id: id });
    n.__sn = serializedNode;
    map[id] = n;
    var recordChild = !skipChild;
    if (serializedNode.type === types_1.NodeType.Element) {
        recordChild = recordChild && !serializedNode.needBlock;
        delete serializedNode.needBlock;
    }
    if ((serializedNode.type === types_1.NodeType.Document ||
        serializedNode.type === types_1.NodeType.Element) &&
        recordChild) {
        for (var _i = 0, _a = Array.from(n.childNodes); _i < _a.length; _i++) {
            var childN = _a[_i];
            var serializedChildNode = serializeNodeWithId(childN, doc, map, blockClass, skipChild, inlineStylesheet, maskInputOptions, recordCanvas);
            if (serializedChildNode) {
                serializedNode.childNodes.push(serializedChildNode);
            }
        }
    }
    return serializedNode;
}
exports.serializeNodeWithId = serializeNodeWithId;
function snapshot(n, blockClass, inlineStylesheet, maskAllInputsOrOptions, recordCanvas) {
    if (blockClass === void 0) { blockClass = 'rr-block'; }
    if (inlineStylesheet === void 0) { inlineStylesheet = true; }
    var idNodeMap = {};
    var maskInputOptions = maskAllInputsOrOptions === true
        ? {
            color: true,
            date: true,
            'datetime-local': true,
            email: true,
            month: true,
            number: true,
            range: true,
            search: true,
            tel: true,
            text: true,
            time: true,
            url: true,
            week: true,
            textarea: true,
            select: true
        }
        : maskAllInputsOrOptions === false
            ? {}
            : maskAllInputsOrOptions;
    return [
        serializeNodeWithId(n, n, idNodeMap, blockClass, false, inlineStylesheet, maskInputOptions, recordCanvas),
        idNodeMap,
    ];
}
function visitSnapshot(node, onVisit) {
    function walk(current) {
        onVisit(current);
        if (current.type === types_1.NodeType.Document ||
            current.type === types_1.NodeType.Element) {
            current.childNodes.forEach(walk);
        }
    }
    walk(node);
}
exports.visitSnapshot = visitSnapshot;
exports["default"] = snapshot;
//# sourceMappingURL=snapshot.js.map