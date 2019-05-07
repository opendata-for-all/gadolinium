const SocketClient = require('../Socket').SocketClient;
let axios = require('axios');
let ping = require('net-ping');
let dns = require('dns');
const loadtest = require('loadtest');

class Slave {
	constructor(config) {
		this._masterInfo = config.master;
		this._region = config.region;
		this._token = config.token;
		this._socketClient = null;
	}

	connectToMasterSocketServer() {
		this._socketClient = new SocketClient(this._masterInfo, this._region, this._token);
		this._socketClient.socketClient.on('connect', () => this.createNewAPITestReceiver())
	}

	sendDataToMaster(channel, data) {
		this._socketClient.send(channel, data);
	}

	createNewAPITestReceiver() {
		this._socketClient.socketClient.on('new api', async (newApi) => {
			console.log(newApi);
			// let numberOfHTTPRequests = newApi.httpRequests.length;
			let result = await this.performTests(newApi);
			this.sendDataToMaster(newApi.id, result);
		})
	}

	async performTests(api) {

		let axiosRequest = async (httpRequest) => {
			// const options = {
			// 	url: method.url,
			// 	maxRequests: 10,
			// };
			httpRequest.test = {};
			let method = httpRequest;
			method.requestsPerSecond = 10;
			method.maxRequests = 10;
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
					console.log(result);
					console.log('Tests run successfully');
				});
			})
		};

		function prepareOpenAPIObjectForTests(httpRequests) {
			for (let httpRequest of httpRequests) {
				httpRequest.test = {};
				httpRequest.test.performanceRecords = [];
				httpRequest.test.successabilityRecords = [];
				httpRequest.test.numberOfTestPerformed = 0;
			}
		}

		let performTestOnEachPath = async (httpRequests) => {
			for (let httpRequest of httpRequests) {
				await axiosRequest(httpRequest);
			}
		};

		prepareOpenAPIObjectForTests(api.httpRequests);
		await performTestOnEachPath(api.httpRequests);
		return api;
	};

}

module.exports = Slave;