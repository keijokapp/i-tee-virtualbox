"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _vboxmanage = _interopRequireDefault(require("./vboxmanage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function _default(name, image, snapshot) {
  if (snapshot) {
    await (0, _vboxmanage.default)('clonevm', image, '--snapshot', snapshot, '--name', name, '--options', 'link', '--register');
  } else {
    await (0, _vboxmanage.default)('clonevm', image, '--name', name, '--register');
  }
}