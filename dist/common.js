'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.logger = undefined;

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = exports.logger = _winston2.default.createLogger({
	format: _winston2.default.format.combine(_winston2.default.format.timestamp(), _winston2.default.format.simple()),
	transports: [new _winston2.default.transports.Console({
		level: 'debug'
	})]
});