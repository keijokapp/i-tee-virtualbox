#!/usr/bin/node
'use strict';

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _common = require('./common');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PipeWrap = process.binding('pipe_wrap');
const Pipe = PipeWrap.Pipe;

function ready() {
	try {
		require('sd-notify').ready();
	} catch (e) {
		_common.logger.debug('Systemd notifications are not available');
	}
}

const server = _http2.default.createServer(_app2.default);

server.on('error', e => {
	_common.logger.error('Server error', { error: e });
});

if (_config2.default.listen === 'systemd') {
	const socketCount = parseInt(process.env.LISTEN_FDS, 10);
	if (!Number.isInteger(socketCount) || socketCount < 1) {
		_common.logger.error('Bad number of sockets', { socketCount });
		process.exit(1);
	}

	for (let i = 0; i < socketCount; i++) {
		const server = _http2.default.createServer(_app2.default);
		if (PipeWrap.constants && typeof PipeWrap.constants.SOCKET !== 'undefined') {
			server._handle = new Pipe(PipeWrap.constants.SOCKET);
		} else {
			server._handle = new Pipe();
		}
		server._handle.open(3 + i);
		server._listen2(null, -1, -1);
	}
	_common.logger.info('Listening', { socket: process.env.LISTEN_FDNAMES });
	ready();
} else {
	server.listen(_config2.default.listen.port, _config2.default.listen.address, () => {
		const address = server.address();
		_common.logger.info('Listening', { address: address.address, port: address.port });
		ready();
	});
}