'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _vboxmanage = require('./vboxmanage');

var _vboxmanage2 = _interopRequireDefault(_vboxmanage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const lineRegex = /^"(.*)" \{([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\}$/gm;

exports.default = async function (running) {
	const stdout = await (0, _vboxmanage2.default)('list', running ? 'runningvms' : 'vms');

	var result = [],
	    m;
	while (m = lineRegex.exec(stdout)) {
		result.push({
			id: m[1],
			uuid: m[2]
		});
	}

	return result;
};