import { readFileSync } from 'fs';

const configFile = '2' in process.argv ? process.argv[2] : '/dev/stdin';

const config = JSON.parse(readFileSync(configFile));

export default config;
