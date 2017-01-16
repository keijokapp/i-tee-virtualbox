#!/usr/bin/babel-node

import http from 'http';
import { logger } from './lib/common';
import config from './lib/config';
import app from './lib/app';

const server = http.createServer(app);

server.on('error', e => {
	logger.error('Server error: %s', e.message);
});

server.listen(config.port, () => {
	const address = server.address();
	logger.info('Listening on %s:%d', address.address, address.port);
});
