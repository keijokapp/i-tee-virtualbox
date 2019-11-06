"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _vboxmanage = _interopRequireDefault(require("./vboxmanage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function _default(name, enabled) {
  await (0, _vboxmanage.default)('controlvm', name, 'vrde', enabled ? 'on' : 'off');
}