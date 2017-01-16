import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import supertest from 'supertest';
import mockery from 'mockery';
import shellEscape from 'shell-escape';


// Mock child_process#execFile

var mocks;

function registerMock(args, mock) {
	const command = shellEscape(args);
	mocks[command] = mock;
}

beforeEach(() => {
	mocks = {};
});

const childProcessMock = {
	execFile: function(file, args, callback) {
		expect(file).to.equal('vboxmanage');
		const command = shellEscape(args);
		if(!(command in mocks)) {
			console.error('Command is not mocked: %s', command);
		} else {
			const mock = mocks[command];
			mock(callback);
		}
	}
};

mockery.enable({
	warnOnUnregistered: false
});
mockery.registerMock('child_process', childProcessMock);

// vboxmanage callback helppers

const activeCallbacks = new Set;
function callback(err, stdout, stderr) {
	function cb(execFileCallback) {
		if(!activeCallbacks.has(cb)) {
			console.error('Callback is not active');
		} else {
			activeCallbacks.delete(cb);
			execFileCallback(err || null, stdout || '', stderr || '');
		}
	}

	activeCallbacks.add(cb);
	return cb;
}

function expectCallbacksCalled() {
	expect(activeCallbacks.size).to.equal(0);
}

// Setup supertest

const app = require('./lib/app').default;
const request = supertest(app);

// Tests

describe('list machines', () => {
	it('should list all machines', async() => {
		registerMock(['list', 'vms'], callback(null, '"qasd" {8a8abd5c-de63-4926-944f-7489b61bc88f}\n"qasdfasd" {dc58f1c2-2e7c-11e7-8125-ffb8cff4b49e}\n'));
		const res = await request.get('/machine')
			.expect(200);
		expectCallbacksCalled();
		expect(res.body).to.deep.equal([{ id: 'qasd' }, { id: 'qasdfasd' }]);
	});

	it('should list running machines', async() => {
		registerMock(['list', 'runningvms'], callback(null, '"qasd" {8a8abd5c-de63-4926-944f-7489b61bc88f}\n"qasdfasd" {dc58f1c2-2e7c-11e7-8125-ffb8cff4b49e}\n'));
		const res = await request.get('/machine?running')
			.expect(200);
		expectCallbacksCalled();
		expect(res.body).to.deep.equal([{ id: 'qasd' }, { id: 'qasdfasd' }]);
	});

	it('should list all machines with details', async() => {
		registerMock(['list', 'vms'], callback(null, '"qasd" {8a8abd5c-de63-4926-944f-7489b61bc88f}\n"qasdfasd" {dc58f1c2-2e7c-11e7-8125-ffb8cff4b49e}\n'));
		registerMock(['showvminfo', 'qasd', '--machinereadable'], callback(null, 'VMState="running"\nvrde="on"\nvrdeport=8693\nCurrentSnapshotName="s4st;e4tjs;g"'));
		registerMock(['showvminfo', 'qasdfasd', '--machinereadable'], callback(null, 'VMState="stopped"\nvrde="on"\nvrdeport=8693\nCurrentSnapshotName="s4st;e4tjs;g"'));
		const res = await request.get('/machine?detailed')
			.expect(200);
		expect(res.body).to.deep.equal([{
			state: 'running',
			rdp: { port: 8693 },
			snapshot: 's4st;e4tjs;g',
			name: 'qasd',
			id: 'qasd'
		}, {
			state: 'stopped',
			rdp: { port: 8693 },
			snapshot: 's4st;e4tjs;g',
			name: 'qasdfasd',
			id: 'qasdfasd'
		}]);
		expectCallbacksCalled();
	});
});

describe('create machine', () => {
	it('should set up simple machine with snapshot', async() => {
		registerMock(['showvminfo', 'fuck', '--machinereadable'], callback(null, 'CurrentSnapshotName="test-snapshot"'));
		registerMock(['clonevm', 'fuck', '--snapshot', 'test-snapshot', '--name', 'hehe', '--options', 'link', '--register'], callback());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="running"\nvrdeport=-1'));
		const res = await request.post('/machine/hehe')
			.send({
				image: 'fuck'
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('running');
		expectCallbacksCalled();
	});

	it('should set up simple machine without snapshot', async() => {
		registerMock(['showvminfo', 'fuck', '--machinereadable'], callback());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="running"\nvrdeport=-1'));
		registerMock(['clonevm', 'fuck', '--name', 'hehe', '--register'], callback());
		const res = await request.post('/machine/hehe')
			.send({
				image: 'fuck'
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('running');
		expectCallbacksCalled();
	});

	it('should create machine with networks', async() => {
		registerMock(['showvminfo', 'fuck', '--machinereadable'], callback());
		registerMock(['clonevm', 'fuck', '--name', 'hehe', '--register'], callback());
		registerMock(['modifyvm', 'hehe', '--nic1', 'intnet'], callback());
		registerMock(['modifyvm', 'hehe', '--intnet1', 'outnet'], callback());
		registerMock(['modifyvm', 'hehe', '--nic2', 'intnet'], callback());
		registerMock(['modifyvm', 'hehe', '--intnet2', 'intnet'], callback());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="running"\nvrdeport=-1'));
		const res = await request.post('/machine/hehe')
			.send({
				image: 'fuck',
				network: ['outnet', 'intnet']
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('running');
		expectCallbacksCalled();
	});

	it('should create machine with DMI properties', async() => {
		registerMock(['showvminfo', 'fuck', '--machinereadable'], callback());
		registerMock(['clonevm', 'fuck', '--name', 'hehe', '--register'], callback());
		registerMock(['setextradata', 'hehe', 'VBoxInternal/Devices/pcbios/0/Config/DmiBIOSVersion', 'bios version'], callback());
		registerMock(['setextradata', 'hehe', 'VBoxInternal/Devices/pcbios/0/Config/DmiBIOSReleaseDate', 'bios release date'], callback());
		registerMock(['setextradata', 'hehe', 'VBoxInternal/Devices/pcbios/0/Config/DmiSystemProduct', 'system product name'], callback());
		registerMock(['setextradata', 'hehe', 'VBoxInternal/Devices/pcbios/0/Config/DmiSystemVendor', 'system vendor'], callback());
		registerMock(['setextradata', 'hehe', 'VBoxInternal/Devices/pcbios/0/Config/DmiSystemVersion', 'system version'], callback());
		registerMock(['setextradata', 'hehe', 'VBoxInternal/Devices/pcbios/0/Config/DmiSystemSerial', 'system serial number'], callback());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="running"\nvrdeport=-1'));
		const res = await request.post('/machine/hehe')
			.send({
				image: 'fuck',
				dmi: {
					'bios-version': 'bios version',
					'bios-release-date': 'bios release date',
					'system-product-name': 'system product name',
					'system-vendor': 'system vendor',
					'system-version': 'system version',
					'system-serial-number': 'system serial number'
				}
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('running');
		expectCallbacksCalled();
	});

	it('should create machine with RDP user', async() => {
		registerMock(['showvminfo', 'fuck', '--machinereadable'], callback());
		registerMock(['clonevm', 'fuck', '--name', 'hehe', '--register'], callback());
		registerMock(['setextradata', 'hehe', 'VBoxAuthSimple/users/random-username', '21937d294d34fe2a07098595fc91a0e347bd30c32cc20afd7086367e46d6c599'], callback());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="running"\nvrdeport=-1'));
		const res = await request.post('/machine/hehe')
			.send({
				image: 'fuck',
				rdp: {
					username: 'random-username',
					password: 'random-password'
				}
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('running');
		expectCallbacksCalled();
	});

	it('should create and start machine', async() => {
		registerMock(['showvminfo', 'fuck', '--machinereadable'], callback());
		registerMock(['clonevm', 'fuck', '--name', 'hehe', '--register'], callback());
		registerMock(['startvm', 'hehe', '--type', 'headless'], callback());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="running"\nvrdeport=-1'));
		const res = await request.post('/machine/hehe')
			.send({
				image: 'fuck',
				state: 'start'
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('running');
		expectCallbacksCalled();
	});

	it('should create and start machine with RDP', async() => {
		registerMock(['showvminfo', 'fuck', '--machinereadable'], callback());
		registerMock(['clonevm', 'fuck', '--name', 'hehe', '--register'], callback());
		registerMock(['setextradata', 'hehe', 'VBoxAuthSimple/users/random-username', '21937d294d34fe2a07098595fc91a0e347bd30c32cc20afd7086367e46d6c599'], callback());
		registerMock(['startvm', 'hehe', '--type', 'headless'], callback());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="running"\nvrdeport=8693'));
		const res = await request.post('/machine/hehe')
			.send({
				image: 'fuck',
				state: 'start',
				rdp: {
					username: 'random-username',
					password: 'random-password'
				}
			})
			.expect(200);
		expectCallbacksCalled();
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.have.deep.property('machine.rdp.port');
		expect(res.body.machine.state).to.equal('running');
		expect(res.body.machine.rdp.port).to.equal(8693);
	});
});

describe('get machine info', () => {
	it('retrieve machine info w/ RDP and snapshot', async() => {
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="running"\nvrde="on"\nvrdeport=8693\nCurrentSnapshotName="s4st;e4tjs;g"'));
		const res = await request.get('/machine/hehe')
			.expect(200);
		expectCallbacksCalled();
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.have.deep.property('machine.rdp.port');
		expect(res.body).to.have.deep.property('machine.snapshot');
		expect(res.body.machine.state).to.equal('running');
		expect(res.body.machine.rdp.port).to.equal(8693);
	});

	it('retrieve machine info w/o RDP and snapshot', async() => {
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="running"\nvrdeport=-1'));
		const res = await request.get('/machine/hehe')
			.expect(200);
		expectCallbacksCalled();
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp.port');
		expect(res.body).to.not.have.deep.property('machine.snapshot');
		expect(res.body.machine.state).to.equal('running');
	});
});

describe('update machine', () => {
	it('set machine state to start', async() => {
		registerMock(['startvm', 'hehe', '--type', 'headless'], callback());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="running"\nvrde="on"\nvrdeport=8693'));
		const res = await request.put('/machine/hehe')
			.send({
				state: 'start'
			})
			.expect(200);
		expectCallbacksCalled();
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.have.deep.property('machine.rdp.port');
		expect(res.body.machine.state).to.equal('running');
		expect(res.body.machine.rdp.port).to.equal(8693);
	});

	it('set machine state to running', async() => {
		registerMock(['startvm', 'hehe', '--type', 'headless'], callback());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="running"\nvrde="on"\nvrdeport=8693'));
		const res = await request.put('/machine/hehe')
			.send({
				state: 'running'
			})
			.expect(200);
		expectCallbacksCalled();
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.have.deep.property('machine.rdp.port');
		expect(res.body.machine.state).to.equal('running');
		expect(res.body.machine.rdp.port).to.equal(8693);
	});

	it('set machine state to stopped', async() => {
		registerMock(['controlvm', 'hehe', 'poweroff'], callback());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="poweroff"\nvrde="on"\nvrdeport=-1'));
		const res = await request.put('/machine/hehe')
			.send({
				state: 'stopped'
			})
			.expect(200);
		expectCallbacksCalled();
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('poweroff');
	});

	it('set machine state to stopped', async() => {
		registerMock(['controlvm', 'hehe', 'poweroff'], callback());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="poweroff"\nvrde="on"\nvrdeport=-1'));
		const res = await request.put('/machine/hehe')
			.send({
				state: 'stopped'
			})
			.expect(200);
		expectCallbacksCalled();
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('poweroff');
	});

	it('set RDP off', async() => {
		registerMock(['controlvm', 'hehe', 'vrde', 'off'], callback());
		registerMock(['controlvm', 'hehe', 'vrde', 'on'], callback());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], callback(null, 'VMState="running"\nvrde="on"\nvrdeport=8693'));
		const res = await request.put('/machine/hehe')
			.send({
				rdp: {
					enabled: false
				}
			})
			.expect(200);
		expectCallbacksCalled();
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.have.deep.property('machine.rdp.port');
		expect(res.body.machine.state).to.equal('running');
		expect(res.body.machine.rdp.port).to.equal(8693);
	});
});

describe('delete machine', () => {
	it('delete machine', async() => {
		registerMock(['controlvm', 'hehe', 'poweroff'], callback());
		registerMock(['unregistervm', 'hehe', '--delete'], callback(null, 'VMState="running"\nvrde="on"\nvrdeport=8693'));
		const res = await request.delete('/machine/hehe')
			.expect(200);
		expectCallbacksCalled();
	});
});

describe('create snapshot', () => {
	it('creates snapshot', async() => {
		registerMock(['snapshot', 'hehe', 'take', 'some-snapshot'], callback());
		const res = await request.post('/machine/hehe/snapshot/some-snapshot')
			.expect(200);
		expectCallbacksCalled();
	});
});

describe('delete snapshot', () => {
	it('creates snapshot', async() => {
		registerMock(['snapshot', 'hehe', 'delete', 'some-snapshot'], callback());
		const res = await request.delete('/machine/hehe/snapshot/some-snapshot')
			.expect(200);
		expectCallbacksCalled();
	});
});
