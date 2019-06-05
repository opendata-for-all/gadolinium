let axios = require('axios');
let ping = require('node-http-ping');
let dns = require('dns');
const loadtest = require('loadtest');

let performPingTest = async (host) => {
	return await ping(host)
		.then(time => true)
		.catch(() => false);
};

let performanceTest = async (httpRequest, requestPerSecond, maxRequests) => {
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
			httpRequest.test.totalTest = result.totalRequests;
			httpRequest.test.avgSuccess = 1 - (result.totalErrors / result.totalRequests);
			httpRequest.test.meanLatency = result.meanLatencyMs;
			resolve(result);
			// console.log(result);
		});
	})
};

let createOpenAPIExtensionObject = (httpRequest) => {
	//TODO OPEN API EXTENSION PROPOSAL
	console.log(httpRequest);
	httpRequest.test = {};
	httpRequest.test.performanceRecords = [];
	httpRequest.test.successabilityRecords = [];
	httpRequest.test.numberOfTestPerformed = 0;
};

let performTestOnEachPath = async (httpRequests) => {
	for (let httpRequest of httpRequests) {
		await performanceTest(httpRequest);
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
		await performanceTest(httpRequest, 1, 1);
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
	performPingTest: performPingTest,
	instantTest: instantTest,
	performTests: performTests,
};
