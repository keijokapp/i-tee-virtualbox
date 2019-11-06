"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _vboxmanage = _interopRequireDefault(require("./vboxmanage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function _default(name, failOnStopped) {
  try {
    await (0, _vboxmanage.default)('controlvm', name, 'poweroff');
  } catch (e) {
    if (failOnStopped || !e.message.includes('is not currently running')) {
      throw e;
    }
  }
}