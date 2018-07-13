import fs from 'fs';
import { validate } from 'jsonschema';

var jsonConfig, config;

if(process.argv.length >= 3) {
	try {
		console.log('Reading configuration from %s', process.argv[2]);
		jsonConfig = fs.readFileSync(process.argv[2]);
	} catch(e) {
		console.error('Failed to read configuration file: ', e.message);
		process.exit(1);
	}
} else {
	try {
		console.log('Reading configuration from standard input');
		jsonConfig = fs.readFileSync(0);
	} catch(e) {
		console.error('Failed to read configuration from standard input: ', e.message);
		process.exit(1);
	}
}

try {
	config = JSON.parse(jsonConfig);
} catch(e) {
	console.error('Failed to parse configuration: ' + e.message);
	process.exit(1);
}

const validationResult = validate(config, {
	oneOf: [{
		type: 'object',
		properties: {
			port: {
				type: 'number',
				min: 0,
				max: 65535
			}
		},
		additionalProperties: false,
		required: ['port']
	}, {
		type: 'object',
		properties: {
			listen: [{
				type: 'string',
				enum: ['systemd']
			}, {
				type: 'object',
				properties: {
					port: {
						type: 'number',
						min: 0,
						max: 65535
					},
					address: {
						type: 'string',
						minLength: 1
					}
				},
				addionalProperties: false,
				required: ['port']
			}]
		},
		additionalProperties: false,
		required: ['listen']
	}]
});

if(validationResult.errors.length) {
	console.error('Found configuration errors:');
	for(const error of validationResult.errors) {
		console.error(error.message);
	}
	process.exit(1);
}

export default config;
