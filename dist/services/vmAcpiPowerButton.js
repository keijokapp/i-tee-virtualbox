'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _vboxmanage = require('./vboxmanage');

var _vboxmanage2 = _interopRequireDefault(_vboxmanage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = async function (name, failOnStopped) {
	try {
		await (0, _vboxmanage2.default)('controlvm', name, 'acpipowerbutton');
	} catch (e) {
		if (failOnStopped || !e.message.includes('is not currently running')) {
			throw e;
		}
	}
};