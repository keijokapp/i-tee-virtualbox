#!/usr/bin/babel-node

import http from 'http';
import { logger } from './lib/common';
import config from './lib/config';
import app from './lib/app';

const server = http.createServer(app);

server.on('error', e => {
	logger.error('Server error', { error: e });
});

server.listen(config.port, () => {
	const address = server.address();
	logger.info('Listening', {address: address.address, port: address.port });
});
