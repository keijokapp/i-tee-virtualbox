"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _crypto = _interopRequireDefault(require("crypto"));

var _vboxmanage = _interopRequireDefault(require("./vboxmanage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function _default(name, username, password) {
  if (password !== undefined && password !== null) {
    const hash = _crypto.default.createHash('sha256');

    hash.end(password);
    const passwordHash = hash.read().toString('hex');
    await (0, _vboxmanage.default)('setextradata', name, 'VBoxAuthSimple/users/' + username, passwordHash);
  } else {
    await (0, _vboxmanage.default)('setextradata', name, 'VBoxAuthSimple/users/' + username);
  }
}