'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _expressWinston = require('express-winston');

var _expressWinston2 = _interopRequireDefault(_expressWinston);

var _expressBearerToken = require('express-bearer-token');

var _expressBearerToken2 = _interopRequireDefault(_expressBearerToken);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _common = require('./common');

var _routes = require('./routes');

var _routes2 = _interopRequireDefault(_routes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const app = (0, _express2.default)();
exports.default = app;


app.set('json spaces', 2);

app.use(_expressWinston2.default.logger({ winstonInstance: _common.logger }));

app.use(_express2.default.json());

if (_config2.default.tokens.length) {
	app.use((0, _expressBearerToken2.default)());
	app.use((req, res, next) => {
		if (_config2.default.tokens.includes(req.token)) {
			next();
		} else {
			res.status(403).send({
				error: 'Forbidden'
			});
		}
	});
}

app.use(_routes2.default);

// catch 404 and forward to error handler
app.use((req, res, next) => {
	res.status(404).send({
		error: 'Not found'
	});
});

app.use((e, req, res, next) => {
	if ('vboxError' in e) {
		_common.logger.error('VirtualBox error', { args: e.args, error: e.message });
		res.status(500).send({
			error: e.vboxError
		});
	} else if (e instanceof SyntaxError || e.name === 'JsonSchemaValidation') {
		res.status(400).send({
			error: 'Bad Request'
		});
	} else {
		_common.logger.error('Unhandled error', { error: e.message });
		res.status(e.status || 500);
		res.send({
			error: 'Unhandled error',
			details: e.message
		});
	}
});