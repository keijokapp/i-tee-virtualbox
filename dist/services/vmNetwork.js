"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _vboxmanage = _interopRequireDefault(require("./vboxmanage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function _default(name, slot, type, network) {
  if (!['intnet', 'bridged'].includes(type)) {
    throw new Error('Unknown network type \'' + type + '\'');
  }

  slot++; // slot indices are 1-based

  try {
    await Promise.all([await (0, _vboxmanage.default)('modifyvm', name, '--nic' + slot, type), await (0, _vboxmanage.default)('modifyvm', name, '--' + (type === 'bridged' ? 'bridgeadapter' : type) + slot, network)]);
  } catch (e) {
    if (e.message.includes('is already locked for a session')) {
      await (0, _vboxmanage.default)('controlvm', name, 'nic' + slot, type, network);
    } else {
      throw e;
    }
  }
}