#!/usr/bin/babel-node

import http from 'http';
import notify from 'sd-notify';
import { logger } from './lib/common';
import config from './lib/config';
import app from './lib/app';

const PipeWrap = process.binding('pipe_wrap');
const Pipe = PipeWrap.Pipe;


const server = http.createServer(app);

server.on('error', e => {
	logger.error('Server error', { error: e });
});

if(config.listen === 'systemd') {
	const socketCount = parseInt(process.env.LISTEN_FDS, 10);
	if(!Number.isInteger(socketCount) || socketCount < 1) {
		logger.error('Bad number of sockets', { socketCount });
		process.exit(1);
	}

	for(let i = 0; i < socketCount; i++) {
		const server = http.createServer(app);
		if(PipeWrap.constants && typeof PipeWrap.constants.SOCKET !== 'undefined') {
			server._handle = new Pipe(PipeWrap.constants.SOCKET);
		} else {
			server._handle = new Pipe();
		}
		server._handle.open(3 + i);
		server._listen2(null, -1, -1);
	}
	logger.info('Listening', { socket: process.env.LISTEN_FDNAMES });
	notify.ready();
} else {
	server.listen(config.listen.port, config.listen.address, () => {
		const address = server.address();
		logger.info('Listening', { address: address.address, port: address.port });
		notify.ready();
	});
}
