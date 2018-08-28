'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _vboxmanage = require('./vboxmanage');

var _vboxmanage2 = _interopRequireDefault(_vboxmanage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = async function (name, slot, network) {

	slot++; // slot indices are 1-based

	try {
		await Promise.all([await (0, _vboxmanage2.default)('modifyvm', name, '--nic' + slot, 'intnet'), await (0, _vboxmanage2.default)('modifyvm', name, '--intnet' + slot, network)]);
	} catch (e) {
		if (e.message.includes('is already locked for a session')) {
			await (0, _vboxmanage2.default)('controlvm', name, 'nic' + slot, 'intnet', network);
		} else {
			throw e;
		}
	}
};