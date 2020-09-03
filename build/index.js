"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
exports.visitSnapshot = exports.transformAttribute = exports.addHoverClass = exports.buildNodeWithSN = exports.rebuild = exports.serializeNodeWithId = exports.snapshot = void 0;
var snapshot_1 = require("./snapshot");
exports.snapshot = snapshot_1["default"];
exports.serializeNodeWithId = snapshot_1.serializeNodeWithId;
exports.transformAttribute = snapshot_1.transformAttribute;
exports.visitSnapshot = snapshot_1.visitSnapshot;
var rebuild_1 = require("./rebuild");
exports.rebuild = rebuild_1["default"];
exports.buildNodeWithSN = rebuild_1.buildNodeWithSN;
exports.addHoverClass = rebuild_1.addHoverClass;
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map