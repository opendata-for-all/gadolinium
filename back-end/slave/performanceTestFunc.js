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

let individualRequestLatencyTest = async (httpRequest, requestPerSecond, maxRequests) => {
	// const options = {
	// 	url: method.url,
	// 	maxRequests: 10,
	// };
	let method = httpRequest;
	method.requestsPerSecond = requestPerSecond;
	method.maxRequests = maxRequests;
	// console.log(method);
	return new Promise((resolve) => {
		loadtest.loadTest(method, function (error, result) {
			if (error) {
				return console.error('Got an error: %s', error);
			}
			// console.log(result);
			let latencyRecord = {
				date: DateTime.fromJSDate(new Date()).toISO(),
				latencyMs: result.meanLatencyMs,
			};
			if (result.errorCodes) {
				latencyRecord.code = Object.keys(result.errorCodes)[0];
			} else {
				latencyRecord.code = 200;
			}
			httpRequest.test.latencyRecords.push(latencyRecord);
			httpRequest.test.avgSuccess = 1 - result.totalErrors;
			httpRequest.test.meanLatency = result.meanLatencyMs;
			resolve(httpRequest.test);
			// console.log(result);
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
