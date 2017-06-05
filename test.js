import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import supertest from 'supertest';
import mockery from 'mockery';
import shellEscape from 'shell-escape';


// Mock child_process#execFile

var mocks;

function registerMock(args, callback) {
	const command = shellEscape(args);
	mocks.push({ command, callback });
}

beforeEach(function() {
	mocks = [];
});

afterEach(function() {
	try {
		expect(mocks.length).to.equal(0);
	} catch(e) {
		this.test.error(e);
	}
});

const childProcessMock = {
	execFile: function(file, args, callback) {
		expect(file).to.equal('vboxmanage');
		const command = shellEscape(args);
		const mock = mocks.shift();
		expect(mock).to.not.be.undefined;
		expect(command).to.equal(mock.command);
		mock.callback(callback);
	}
};

mockery.enable({
	warnOnUnregistered: false
});
mockery.registerMock('child_process', childProcessMock);

function mock(err, stdout) {
	return function cb(execFileCallback) {
		if(err && typeof err === 'string') {
			err = new Error(err);
		}
		execFileCallback(err || null, stdout || '');
	}
}

// Setup supertest

const app = require('./lib/app').default;
const request = supertest(app);

// Tests

describe('list machines', () => {
	it('should list all machines', async() => {
		registerMock(['list', 'vms'], mock(null, '"qasd" {8a8abd5c-de63-4926-944f-7489b61bc88f}\n"qasdfasd" {dc58f1c2-2e7c-11e7-8125-ffb8cff4b49e}\n'));
		const res = await request.get('/machine')
			.expect(200);
		expect(res.body).to.deep.equal([{ id: 'qasd' }, { id: 'qasdfasd' }]);
	});

	it('should list running machines', async() => {
		registerMock(['list', 'runningvms'], mock(null, '"qasd" {8a8abd5c-de63-4926-944f-7489b61bc88f}\n"qasdfasd" {dc58f1c2-2e7c-11e7-8125-ffb8cff4b49e}\n'));
		const res = await request.get('/machine?running')
			.expect(200);
		expect(res.body).to.deep.equal([{ id: 'qasd' }, { id: 'qasdfasd' }]);
	});

	it('should list all machines with details', async() => {
		registerMock(['list', 'vms'], mock(null, '"qasd" {8a8abd5c-de63-4926-944f-7489b61bc88f}\n"qasdfasd" {dc58f1c2-2e7c-11e7-8125-ffb8cff4b49e}\n'));
		registerMock(['showvminfo', 'qasd', '--machinereadable'], mock(null, 'VMState="running"\nvrde="on"\nvrdeport=8693\nCurrentSnapshotName="s4st;e4tjs;g"'));
		registerMock(['showvminfo', 'qasdfasd', '--machinereadable'], mock(null, 'VMState="stopped"\nvrde="on"\nvrdeport=8693\nCurrentSnapshotName="s4st;e4tjs;g"'));
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
	});
});

describe('create machine', () => {
	it('should set up simple machine with snapshot', async() => {
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock('Could not find a registered machine named'));
		registerMock(['showvminfo', 'fuck', '--machinereadable'], mock(null, 'CurrentSnapshotName="test-snapshot"'));
		registerMock(['clonevm', 'fuck', '--snapshot', 'test-snapshot', '--name', 'hehe', '--options', 'link', '--register'], mock());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="running"\nvrdeport=-1'));
		const res = await request.post('/machine/hehe')
			.send({
				image: 'fuck'
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('running');
	});

	it('should set up simple machine without snapshot', async() => {
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock('Could not find a registered machine named'));
		registerMock(['showvminfo', 'fuck', '--machinereadable'], mock());
		registerMock(['clonevm', 'fuck', '--name', 'hehe', '--register'], mock());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="running"\nvrdeport=-1'));
		const res = await request.post('/machine/hehe')
			.send({
				image: 'fuck'
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('running');
	});

	it('should create machine with networks', async() => {
		registerMock(['showvminfo', 'fuck', '--machinereadable'], mock());
		registerMock(['clonevm', 'fuck', '--name', 'hehe', '--register'], mock());
		registerMock(['modifyvm', 'hehe', '--nic1', 'intnet'], mock());
		registerMock(['modifyvm', 'hehe', '--intnet1', 'outnet'], mock());
		registerMock(['modifyvm', 'hehe', '--nic2', 'intnet'], mock());
		registerMock(['modifyvm', 'hehe', '--intnet2', 'intnet'], mock());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="running"\nvrdeport=-1'));
		const res = await request.post('/machine/hehe')
			.send({
				image: 'fuck',
				network: ['outnet', 'intnet']
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('running');
	});

	it('should create machine with DMI properties', async() => {
		registerMock(['showvminfo', 'fuck', '--machinereadable'], mock());
		registerMock(['clonevm', 'fuck', '--name', 'hehe', '--register'], mock());
		registerMock(['setextradata', 'hehe', 'VBoxInternal/Devices/pcbios/0/Config/DmiBIOSVersion', 'bios version'], mock());
		registerMock(['setextradata', 'hehe', 'VBoxInternal/Devices/pcbios/0/Config/DmiBIOSReleaseDate', 'bios release date'], mock());
		registerMock(['setextradata', 'hehe', 'VBoxInternal/Devices/pcbios/0/Config/DmiSystemProduct', 'system product name'], mock());
		registerMock(['setextradata', 'hehe', 'VBoxInternal/Devices/pcbios/0/Config/DmiSystemVendor', 'system vendor'], mock());
		registerMock(['setextradata', 'hehe', 'VBoxInternal/Devices/pcbios/0/Config/DmiSystemVersion', 'system version'], mock());
		registerMock(['setextradata', 'hehe', 'VBoxInternal/Devices/pcbios/0/Config/DmiSystemSerial', 'system serial number'], mock());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="running"\nvrdeport=-1'));
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
	});

	it('should create machine with RDP user', async() => {
		registerMock(['showvminfo', 'fuck', '--machinereadable'], mock());
		registerMock(['clonevm', 'fuck', '--name', 'hehe', '--register'], mock());
		registerMock(['setextradata', 'hehe', 'VBoxAuthSimple/users/random-username', '21937d294d34fe2a07098595fc91a0e347bd30c32cc20afd7086367e46d6c599'], mock());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="running"\nvrdeport=-1'));
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
	});

	it('should create and start machine', async() => {
		registerMock(['showvminfo', 'fuck', '--machinereadable'], mock());
		registerMock(['clonevm', 'fuck', '--name', 'hehe', '--register'], mock());
		registerMock(['startvm', 'hehe', '--type', 'headless'], mock());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="running"\nvrdeport=-1'));
		const res = await request.post('/machine/hehe')
			.send({
				image: 'fuck',
				state: 'start'
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('running');
	});

	it('should create and start machine with RDP', async() => {
		registerMock(['showvminfo', 'fuck', '--machinereadable'], mock());
		registerMock(['clonevm', 'fuck', '--name', 'hehe', '--register'], mock());
		registerMock(['setextradata', 'hehe', 'VBoxAuthSimple/users/random-username', '21937d294d34fe2a07098595fc91a0e347bd30c32cc20afd7086367e46d6c599'], mock());
		registerMock(['startvm', 'hehe', '--type', 'headless'], mock());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="running"\nvrdeport=8693'));
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
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.have.deep.property('machine.rdp.port');
		expect(res.body.machine.state).to.equal('running');
		expect(res.body.machine.rdp.port).to.equal(8693);
	});
});

describe('get machine info', () => {
	it('retrieve machine info w/ RDP and snapshot', async() => {
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="running"\nvrde="on"\nvrdeport=8693\nCurrentSnapshotName="s4st;e4tjs;g"'));
		const res = await request.get('/machine/hehe')
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.have.deep.property('machine.rdp.port');
		expect(res.body).to.have.deep.property('machine.snapshot');
		expect(res.body.machine.state).to.equal('running');
		expect(res.body.machine.rdp.port).to.equal(8693);
	});

	it('retrieve machine info w/o RDP and snapshot', async() => {
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="running"\nvrdeport=-1'));
		const res = await request.get('/machine/hehe')
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp.port');
		expect(res.body).to.not.have.deep.property('machine.snapshot');
		expect(res.body.machine.state).to.equal('running');
	});
});

describe('update machine', () => {
	it('set machine state to start', async() => {
		registerMock(['startvm', 'hehe', '--type', 'headless'], mock());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="running"\nvrde="on"\nvrdeport=8693'));
		const res = await request.put('/machine/hehe')
			.send({
				state: 'start'
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.have.deep.property('machine.rdp.port');
		expect(res.body.machine.state).to.equal('running');
		expect(res.body.machine.rdp.port).to.equal(8693);
	});

	it('set machine state to running', async() => {
		registerMock(['startvm', 'hehe', '--type', 'headless'], mock());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="running"\nvrde="on"\nvrdeport=8693'));
		const res = await request.put('/machine/hehe')
			.send({
				state: 'running'
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.have.deep.property('machine.rdp.port');
		expect(res.body.machine.state).to.equal('running');
		expect(res.body.machine.rdp.port).to.equal(8693);
	});

	it('set machine state to stopped', async() => {
		registerMock(['controlvm', 'hehe', 'poweroff'], mock());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="poweroff"\nvrde="on"\nvrdeport=-1'));
		const res = await request.put('/machine/hehe')
			.send({
				state: 'stopped'
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('poweroff');
	});

	it('set machine state to stopped', async() => {
		registerMock(['controlvm', 'hehe', 'poweroff'], mock());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="poweroff"\nvrde="on"\nvrdeport=-1'));
		const res = await request.put('/machine/hehe')
			.send({
				state: 'stopped'
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.not.have.deep.property('machine.rdp');
		expect(res.body.machine.state).to.equal('poweroff');
	});

	it('set RDP off', async() => {
		registerMock(['controlvm', 'hehe', 'vrde', 'off'], mock());
		registerMock(['controlvm', 'hehe', 'vrde', 'on'], mock());
		registerMock(['showvminfo', 'hehe', '--machinereadable'], mock(null, 'VMState="running"\nvrde="on"\nvrdeport=8693'));
		const res = await request.put('/machine/hehe')
			.send({
				rdp: {
					enabled: false
				}
			})
			.expect(200);
		expect(res.body).to.have.deep.property('machine.state');
		expect(res.body).to.have.deep.property('machine.rdp.port');
		expect(res.body.machine.state).to.equal('running');
		expect(res.body.machine.rdp.port).to.equal(8693);
	});
});

describe('delete machine', () => {
	it('delete machine', async() => {
		registerMock(['controlvm', 'hehe', 'poweroff'], mock());
		registerMock(['unregistervm', 'hehe', '--delete'], mock(null, 'VMState="running"\nvrde="on"\nvrdeport=8693'));
		const res = await request.delete('/machine/hehe')
			.expect(200);
	});
});

describe('create snapshot', () => {
	it('creates snapshot', async() => {
		registerMock(['snapshot', 'hehe', 'take', 'some-snapshot'], mock());
		const res = await request.post('/machine/hehe/snapshot/some-snapshot')
			.expect(200);
	});
});

describe('delete snapshot', () => {
	it('creates snapshot', async() => {
		registerMock(['snapshot', 'hehe', 'delete', 'some-snapshot'], mock());
		const res = await request.delete('/machine/hehe/snapshot/some-snapshot')
			.expect(200);
	});
});
