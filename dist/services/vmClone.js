'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _vboxmanage = require('./vboxmanage');

var _vboxmanage2 = _interopRequireDefault(_vboxmanage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = async function (name, image, snapshot) {
	if (snapshot) {
		await (0, _vboxmanage2.default)('clonevm', image, '--snapshot', snapshot, '--name', name, '--options', 'link', '--register');
	} else {
		await (0, _vboxmanage2.default)('clonevm', image, '--name', name, '--register');
	}
};