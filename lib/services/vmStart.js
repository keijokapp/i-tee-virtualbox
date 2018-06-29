import vboxmanageService from './vboxmanage';

let lockPromise = Promise.resolve();

export default async function(name, failOnRunning) {
	lockPromise = lockPromise.catch(() => {
		// ignored intentionally
	}).then(async () => {
			try {
				await vboxmanageService('startvm', name, '--type', 'headless');
			} catch(e) {
				if(failOnRunning || !e.message.includes('is already locked by a session')) {
					throw e;
				}
			}
		}
	);

	return lockPromise;
}
