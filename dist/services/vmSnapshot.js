"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _vboxmanage = _interopRequireDefault(require("./vboxmanage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function _default(name, snapshotName, create) {
  // FIXME: should deletion be in separate service?
  if (arguments.length < 3) {
    create = true;
  }

  await (0, _vboxmanage.default)('snapshot', name, create ? 'take' : 'delete', snapshotName);
}