#!/usr/bin/node
"use strict";

var _http = _interopRequireDefault(require("http"));

var _common = require("./common");

var _config = _interopRequireDefault(require("./config"));

var _app = _interopRequireDefault(require("./app"));

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

function createServer() {
  const server = _http.default.createServer(_app.default);

  server.on('error', e => {
    _common.logger.error('Server error', {
      error: e
    });
  });
  return server;
}

if (_config.default.listen === 'systemd') {
  const socketCount = parseInt(process.env.LISTEN_FDS, 10);

  if (!Number.isInteger(socketCount) || socketCount < 1) {
    _common.logger.error('Bad number of sockets', {
      socketCount
    });

    process.exit(1);
  }

  for (let i = 0; i < socketCount; i++) {
    const server = createServer();

    if (PipeWrap.constants && typeof PipeWrap.constants.SOCKET !== 'undefined') {
      server._handle = new Pipe(PipeWrap.constants.SOCKET);
    } else {
      server._handle = new Pipe();
    }

    server._handle.open(3 + i);

    server._listen2(null, -1, -1);
  }

  _common.logger.info('Listening', {
    socket: process.env.LISTEN_FDNAMES
  });

  ready();
} else {
  const server = createServer();
  server.listen(_config.default.listen.port, _config.default.listen.address, () => {
    const address = server.address();

    _common.logger.info('Listening', {
      address: address.address,
      port: address.port
    });

    ready();
  });
}