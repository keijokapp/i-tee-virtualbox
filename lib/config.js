
const config = {
	listen: {},
	tokens: []
};

for(let i = 2; i < process.argv.length; i++) {
	switch(process.argv[i]) {
		case '-h':
		case '--help':
			console.log('Usage: %s {--systemd|[--address] [--port]} [--token authorization-token]*');
			process.exit(0);
			break;
		case '--systemd':
			if('address' in config.listen || 'port' in config.listen) {
				console.error('Configuration error: \'--systemd\' cannot coexist with \'--address\' or \'--port\'');
				process.exit(1);
			}
			config.listen = 'systemd';
			break;
		case '--address':
			if(config.listen === '--systemd') {
				console.error('Configuration error: option \'--address\' cannot coexist with \'--systemd\'');
				process.exit(1);
			}

			if('address' in config.listen) {
				console.error('Configuration error: unexpected duplicate option \'--address\'');
				process.exit(1);
			}

			if(i === process.argv.length) {
				console.error('Configuration error: option \'--address\' expects value');
				process.exit(1);
			}

			config.listen.address = process.argv[++i];
			break;
		case '--port':
			if(config.listen === '--systemd') {
				console.error('Configuration error: option \'--port\' cannot coexist with \'--systemd\'');
				process.exit(1);
			}

			if('port' in config.listen) {
				console.error('Configuration error: unexpected duplicate option \'--port\'');
				process.exit(1);
			}

			const port = Number(process.argv[++i]);
			if(!Number.isInteger(port) || port < 0 || port > 65535) {
				console.error('Configuration error: option \'--\' expects integer value between 0 and 65535 (both inclusive)');
				process.exit(1);
			}

			config.listen.port = port;
			break;
		case '--token':
			if(i === process.argv.length) {
				console.error('Configuration error: option \'--token\' expects value');
				process.exit(1);
			}

			config.tokens.push(process.argv[++i]);
			break;
		default:
			console.error('Configuration error: unknown option \'%s\'', process.argv[i]);
			process.exit(1);
	}
}

export default config;
