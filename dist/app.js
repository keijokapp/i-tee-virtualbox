"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _express = _interopRequireDefault(require("express"));

var _expressWinston = _interopRequireDefault(require("express-winston"));

var _expressBearerToken = _interopRequireDefault(require("express-bearer-token"));

var _config = _interopRequireDefault(require("./config"));

var _common = require("./common");

var _routes = _interopRequireDefault(require("./routes"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const app = (0, _express.default)();
var _default = app;
exports.default = _default;
app.set('json spaces', 2);
app.use(_expressWinston.default.logger({
  winstonInstance: _common.logger
}));
app.use(_express.default.json());

if (_config.default.tokens.length) {
  app.use((0, _expressBearerToken.default)());
  app.use((req, res, next) => {
    if (_config.default.tokens.includes(req.token)) {
      next();
    } else {
      res.status(403).send({
        error: 'Forbidden'
      });
    }
  });
}

app.use(_routes.default); // catch 404 and forward to error handler

app.use((req, res, next) => {
  res.status(404).send({
    error: 'Not found'
  });
});
app.use((e, req, res, next) => {
  if ('vboxError' in e) {
    _common.logger.error('VirtualBox error', {
      args: e.args,
      error: e.message
    });

    res.status(500).send({
      error: e.vboxError
    });
  } else if (e instanceof SyntaxError || e.name === 'JsonSchemaValidation') {
    res.status(400).send({
      error: 'Bad Request'
    });
  } else {
    _common.logger.error('Unhandled error', {
      error: e.message
    });

    res.status(e.status || 500);
    res.send({
      error: 'Unhandled error',
      details: e.message
    });
  }
});