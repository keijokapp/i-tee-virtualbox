import { logger } from '../common';
import vboxmanageService from './vboxmanage';


const regex = /^Name: \/VirtualBox\/GuestInfo\/Net\/([0-9]+)\/V4\/IP, value: ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+), timestamp: [0-9]+, flags: $/mg;

export default async function(name) {
	const stdout = await vboxmanageService('guestproperty', 'enumerate', name, '--patterns', '/VirtualBox/GuestInfo/Net/*/V4/IP');

	const ips = { };

	let m;
	while(m = regex.exec(stdout)) {
		ips[m[1]] = m[2];
	}

	logger.debug('Machine IP-s', {
		machine: name,
		ips
	});

	return ips;
}
