import express from 'express';
import expressWinston from 'express-winston';
import bodyParser from 'body-parser';
import { logger } from './common';
import routes from './routes';


const app = express();
export default app;

app.set('json spaces', 2);

app.use(expressWinston.logger({ winstonInstance: logger }));

app.use(bodyParser.json());

app.use(routes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
	res.status(404).send({
		error: 'Not found'
	});
});

app.use((e, req, res, next) => {
	if('vboxError' in e) {
		if(e.vboxError === 'Not found') {
			res.status(404);
		} else {
			res.status(500);
		}
		res.send({
			error: e.vboxError
		})
	} else if(e instanceof SyntaxError || e.name === 'JsonSchemaValidation') {
		res.status(400).send({
			error: 'Bad Request'
		})
	} else {
		logger.error('Unhandled error', { error: e.message });
		res.status(e.status || 500);
		res.send({
			error: 'Unhandled error',
			details: e.message
		});
	}
});
