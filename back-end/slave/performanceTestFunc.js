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
	httpRequest.test = {};
	httpRequest.test.latencyRecords = [];
	httpRequest.test.totalTest = 1;
	httpRequest.test.avgSuccess = 1;
	httpRequest.test.meanLatency = null;
};

let singleLatencyTest = async (sendMessageFunction, api) => {
	let results = {};
	results.apiId = api.id;
	results.progress = 0;
	results.httpRequestIndex = 0;
	results.totalProgress = api.httpRequests.length;
	for (let httpRequest of api.httpRequests) {
		createOpenAPIExtensionObject(httpRequest);
		results.testResults = await individualRequestLatencyTest(httpRequest, 0.5, 1, api.testConfig.latency['timeout-threshold']);
		results.progress++;
		sendMessageFunction('record', results);
		results.httpRequestIndex++;
	}
	sendMessageFunction('repetition', {apiId: api.id});
};

let singleUptimeTest = async (sendMessageFunction, api) => {
	let results = {};
	results.apiId = api.id;
	results.progress = 1;
	results.totalProgress = api.testConfig.uptime.repetitions;
	try {
		let res = await nodefetch('http://' + api.name, {method: 'OPTIONS'});
		results.up = parseInt(res.status) < 500;
	} catch (e) {
		results.up = false;
	}
	results.date = DateTime.fromJSDate(new Date()).toISO();
	console.log('Message sent to Master : ' + results.up + ' at ' + results.date.valueOf());
	sendMessageFunction('record', results);
};

let multipleTests = async (sendMessageFunction, api, testType) => {
	let repetitions = parseInt(api.testConfig[testType].repetitions);
	console.log(repetitions);
	if (repetitions === 1) {
		await module.exports[testType].singleTest(sendMessageFunction, api);
		sendMessageFunction('repetition', {apiId: api.id});
	} else {
		let intervalVal = Duration.fromISO(api.testConfig[testType].interval.iso8601format).valueOf();
		for (let i = 0; i < repetitions; i++) {
			if (i === 0) {
				module.exports[testType].singleTest(sendMessageFunction, api);
				sendMessageFunction('repetition', {apiId: api.id});
				console.log("Slave will restart testing in " + intervalVal / 60000);
			} else {
				setTimeout(async () => {
					module.exports[testType].singleTest(sendMessageFunction, api);
					sendMessageFunction('repetition', {apiId: api.id});
					console.log("Slave will restart testing in " + intervalVal / 60000);
				}, intervalVal * i);
			}
		}
	}
};

module.exports = {
	multipleTests: multipleTests,
	latency: {
		singleTest: singleLatencyTest,
	},
	uptime: {
		singleTest: singleUptimeTest,
	}
};
