'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _vboxmanage = require('./vboxmanage');

var _vboxmanage2 = _interopRequireDefault(_vboxmanage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = async function (name, snapshotName, create) {
	// FIXME: should deletion be in separate service?
	if (arguments.length < 3) {
		create = true;
	}
	await (0, _vboxmanage2.default)('snapshot', name, create ? 'take' : 'delete', snapshotName);
};