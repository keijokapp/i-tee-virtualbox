import express from 'express';
import expressWinston from 'express-winston';
import bearerToken from 'express-bearer-token';
import config from './config';
import { logger } from './common';
import routes from './routes';


const app = express();
export default app;

app.set('json spaces', 2);

app.use(expressWinston.logger({ winstonInstance: logger }));

app.use(express.json());

if(config.tokens.length) {
	app.use(bearerToken());
	app.use((req, res, next) => {
		if(config.tokens.includes(req.token)) {
			next();
		} else {
			res.status(403).send({
				error: 'Forbidden'
			});
		}
	});
}

app.use(routes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
	res.status(404).send({
		error: 'Not found'
	});
});

app.use((e, req, res, next) => {
	if('vboxError' in e) {
		logger.error('VirtualBox error', { args: e.args, error: e.message });
		res.status(500).send({
			error: e.vboxError
		});
	} else if(e instanceof SyntaxError || e.name === 'JsonSchemaValidation') {
		res.status(400).send({
			error: 'Bad Request'
		});
	} else {
		logger.error('Unhandled error', { error: e.message });
		res.status(e.status || 500);
		res.send({
			error: 'Unhandled error',
			details: e.message
		});
	}
});
