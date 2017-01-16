import vboxmanageService from './vboxmanage';

const lineRegex = /^"(.*)" \{[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\}$/gm;

export default async function(running) {
	const stdout = await vboxmanageService('list', running ? 'runningvms' : 'vms');

	var result = [], m;
	while(m = lineRegex.exec(stdout)) {
		result.push(m[1]);
	}

	return result;
}
