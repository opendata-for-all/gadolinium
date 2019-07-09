let axios = require('axios');
let {DateTime, Duration} = require('luxon');
let ping = require('node-http-ping');
let dns = require('dns');
const loadtest = require('loadtest');
const nodefetch = require('node-fetch');

let individualRequestLatencyTest = async (httpRequest, requestPerSecond, maxRequests, timeoutThreshold) => {
	let method = httpRequest;
	method.requestsPerSecond = requestPerSecond;
	method.maxRequests = maxRequests;
	method.timeout = timeoutThreshold;
	return new Promise((resolve) => {
		loadtest.loadTest(method, function (error, result) {
			if (error) {
				return console.error('Got an error: %s', error);
			}
			console.log(result);
			let latencyRecord = {
				date: DateTime.fromJSDate(new Date()).toISO()
			};
			if (result.errorCodes['-1']) {
				latencyRecord.error = true;
				latencyRecord.errorType = 'Request timed out';
				latencyRecord.latencyMs = 0;
				httpRequest.test.success = 0;
			} else if (Object.values(result.errorCodes)[0] >= 500) {
				latencyRecord.error = true;
				latencyRecord.errorType = 'Other error';
				latencyRecord.code = Object.keys(result.errorCodes)[0];
				latencyRecord.latencyMs = 0;
				httpRequest.test.success = 0;
			} else {
				latencyRecord.error = false;
				latencyRecord.code = Object.keys(result.errorCodes)[0];
				latencyRecord.latencyMs = result.meanLatencyMs;
				httpRequest.test.meanLatency = (httpRequest.test.meanLatency * httpRequest.test.latencyRecords.length) + result.meanLatencyMs / (httpRequest.test.latencyRecords.length + 1);
				httpRequest.test.success = 0;
				httpRequest.test.avgSuccess = ((httpRequest.test.avgSuccess * httpRequest.test.latencyRecords.length) + 1) / (httpRequest.test.latencyRecords.length + 1);
			}
			httpRequest.test.latencyRecords.push(latencyRecord);
			resolve(httpRequest.test);
		});
	})
};

let createOpenAPIExtensionObject = (httpRequest) => {
	//TODO OPEN API EXTENSION PROPOSAL
	httpRequest.test = {};
	httpRequest.test.latencyRecords = [];
	httpRequest.test.totalTest = 1;
	httpRequest.test.avgSuccess = 1;
	httpRequest.test.meanLatency = null;
};

let sendDataToMaster = (socketClient, channel, data) => {
	socketClient.emit(channel, data);
};

let singleLatencyTest = async (socketClient, api) => {
	let results = {};
	results.apiId = api.id;
	results.progress = 0;
	results.httpRequestIndex = 0;
	results.totalProgress = api.httpRequests.length;
	for (let httpRequest of api.httpRequests) {
		createOpenAPIExtensionObject(httpRequest);
		results.testResults = await individualRequestLatencyTest(httpRequest, 0.5, 1, api.testConfig.latency.timeoutThreshold);
		results.progress++;
		sendDataToMaster(socketClient, 'record', results);
		results.httpRequestIndex++;
	}
};

let singleUptimeTest = async (socketClient, api) => {
	let results = {};
	results.apiId = api.id;
	results.progress = 1;
	results.totalProgress = api.testConfig.uptime.repetitions;
	try {
		let res = await nodefetch('http://' + api.name, {method: 'OPTIONS'});
		console.log(res);
		results.up = parseInt(res.status) < 500;
	} catch (e) {
		results.up = false;
	}
	results.date = DateTime.fromJSDate(new Date()).toISO();
	console.log('Message sent to Master : ' + results.up + ' at ' + results.date.valueOf());
	sendDataToMaster(socketClient, 'record', results);
};

let multipleTests = async (socketClient, api, testType) => {
	let repetitions = parseInt(api.testConfig[testType].repetitions);
	console.log(repetitions);
	if (repetitions === 1) {
		await module.exports[testType].singleTest(socketClient, api);
		socketClient.emit('test', {apiId: api.id});
	} else {
		let intervalVal = Duration.fromISO(api.testConfig[testType].interval.iso8601format).valueOf();
		for (let i = 0; i < repetitions; i++) {
			if (i === 0) {
				await module.exports[testType].singleTest(socketClient, api);
				console.log("Slave will restart testing in " + intervalVal / 60000);
			} else {
				setTimeout(async () => {
					if (i === repetitions) socketClient.emit('test', {apiId: api.id});
					else {
						socketClient.emit('repetition', {apiId: api.id});
						console.log("Slave will restart testing in " + intervalVal / 60000);
					}
				}, intervalVal * (i + 1));
			}
		}
	}
};

let options = {
	url: 'http://localhost:8082/test',
	maxRequests: 10,
	timeout: 1000,
};

// loadtest.loadTest(options, function (error, result) {
// 	if (error) {
// 		return console.error('Got an error: %s', error);
// 	}
// 	console.log('Tests run successfully');
// 	console.log(result);
// });
// nodefetch('http://localhost:8082/test', {timeout : 1000}).then(res => console.log(res));

module.exports = {
	multipleTests: multipleTests,
	latency: {
		singleTest: singleLatencyTest,
	},
	uptime: {
		singleTest: singleUptimeTest,
	}
};
