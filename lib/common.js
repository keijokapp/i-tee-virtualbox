import winston from 'winston';


export const logger = winston.createLogger({
	format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
	transports: [
		new winston.transports.Console({
			level: 'debug'
		})
	]
});


const machineLocks = {};

export async function lockMachine(name, callback) {
	const promise = Promise.resolve(machineLocks[name]).then(callback);
	machineLocks[name] = promise.catch(e => {});
	return await promise;
}
