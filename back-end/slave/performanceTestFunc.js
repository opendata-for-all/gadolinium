let axios = require('axios');
let {DateTime, Duration} = require('luxon');
let ping = require('node-http-ping');
let dns = require('dns');
const loadtest = require('loadtest');
const nodefetch = require('node-fetch');

let performPingTest = async (host) => {
	return await ping(host)
		.then(time => true)
		.catch(() => false);
};

let individualRequestLatencyTest = async (httpRequest, requestPerSecond, maxRequests, timeoutThreshold) => {
	// const options = {
	// 	url: method.url,
	// 	maxRequests: 10,
	// };
	console.log(timeoutThreshold);
	let method = httpRequest;
	method.requestsPerSecond = requestPerSecond;
	method.maxRequests = maxRequests;
	method.timeout = timeoutThreshold;
	// console.log(method);
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

let performTestOnEachPath = async (httpRequests) => {
	for (let httpRequest of httpRequests) {
		await individualRequestLatencyTest(httpRequest);
	}
};

let sendDataToMaster = (socketClient, channel, data) => {
	socketClient.emit(channel, data);
};

let instantTest = async (socketClient, api) => {
	let httpRequests = api.httpRequests;
	for (let i = 0; i < httpRequests.length; i++) {
		let httpRequest = httpRequests[i];
		createOpenAPIExtensionObject(httpRequest);
		await individualRequestLatencyTest(httpRequest, 1, 1);
		api.progress++;
		if (api.progress === api.totalProgress) {
			api.progressStatus = "Tests completed"
		} else {
			api.progressStatus = "Tests in progress";
		}
		sendDataToMaster(socketClient, 'testProgression', api)
	}
};

let performTests = async (api) => {
	createOpenAPIExtensionObject(api.httpRequests);
	await performTestOnEachPath(api.httpRequests);
	return api;
};

let singleLatencyTest = async (socketClient, api) => {
	let results = {};
	results.apiId = api.id;
	results.progress = 1;
	results.httpRequestIndex = 0;
	results.totalProgress = api.httpRequests.length;
	for (let httpRequest of api.httpRequests) {
		createOpenAPIExtensionObject(httpRequest);
		console.log(api.testConfig);
		results.testResults = await individualRequestLatencyTest(httpRequest, 0.5, 1, api.testConfig.latency.timeoutThreshold);
		sendDataToMaster(socketClient, 'testProgression', results);
		results.progress++;
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
	sendDataToMaster(socketClient, 'testProgression', results);
};

let multipleTests = async (socketClient, api, testType) => {
	await module.exports[testType].singleTest(socketClient, api);
	socketClient.emit('repetitionFinished', {apiId: api.id});
	let repetitions = parseInt(api.testConfig[testType].repetitions);
	let intervalCounter = 1;
	let intervalVal = Duration.fromISO(api.testConfig[testType].interval.iso8601format).valueOf();
	if (intervalCounter !== repetitions) {
		let intervalFun = setInterval(async () => {
			await module.exports[testType].singleTest(socketClient, api);
			intervalCounter++;
			console.log('Repetitions = ' + repetitions);
			console.log('IntervalCounter = ' + intervalCounter);
			if (intervalCounter === repetitions) {
				clearInterval(intervalFun);
				socketClient.emit('completeTestFinished', {apiId: api.id});
			} else {
				socketClient.emit('repetitionFinished', {apiId: api.id});
				console.log("Slave will restart testing in " + intervalVal / 60000);
			}
		}, intervalVal);
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
	},
	performPingTest: performPingTest,
	instantTest: instantTest,
	performTests: performTests,
};
