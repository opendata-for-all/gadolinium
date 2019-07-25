let fs = require('fs');
let path = require('path');
let {Duration} = require('luxon');
let GCPFunc = require('../GoogleCloudManagement/functions');

let EXECUTION_TYPE_TRESHOLD_MINUTE = 10;

/**
 *********************************
 * ACCESS APISTATUS INFORMATION
 *********************************
 */


/**
 * Read the APIStatus.json file and send the APIStatus attribute
 * @returns {*}
 */
let getAPIStatus = () => {
	let APIStatus = fs.readFileSync(path.join(__dirname, 'APIStatus.json'));
	return JSON.parse(APIStatus).APIStatus;
};

/**
 * Return an API based on its id
 * @param apiId
 * @returns {*}
 */
let getAPI = (apiId) => {
	let APIStatus = getAPIStatus();
	let apiR;
	APIStatus.some(api => api.id === apiId ? apiR = api : false);
	return apiR;
};

/**
 * Return a server based on its API's id and its name
 * @param apiId
 * @param serverName
 * @returns {*}
 */
let getServer = (apiId, serverName) => {
	let serverR;
	let api = getAPI(apiId);
	api.servers.some((server) => {
		if (server.name === serverName) {
			return serverR = server;
		}
	});
	return serverR;
};

/**
 * Return an HTTPRequest Object based on its API's id and its index in the HTTPRequest list
 * @param apiId
 * @param httpRequestIndex
 * @returns {*}
 */
let getHTTPRequest = (apiId, httpRequestIndex) => {
	let APIStatus = getAPIStatus();
	return APIStatus.filter(api => api.id === apiId).map(api => api.httpRequests[httpRequestIndex])[0]
};

/**
 * Return the interval of time in Latency OpenAPITestConfiguration, in milliseconds
 * @param apiId
 * @returns number
 */
let getLatencyInterval = (apiId) => {
	let intervalInMilli;
	let APIStatus = getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			return intervalInMilli = Duration.fromISO(api.testConfig.latency.interval.iso8601format).valueOf();
		}
	});
	return intervalInMilli;
};

/**
 * Return the interval of time in Latency OpenAPITestConfiguration, in milliseconds
 * @param apiId
 * @returns {*}
 */
let getUptimeInterval = (apiId) => {
	let intervalInMilli;
	let APIStatus = getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			return intervalInMilli = Duration.fromISO(api.testConfig.uptime.interval.iso8601format).valueOf();
		}
	});
	return intervalInMilli;
};

/**
 * Return whether a server has only one repetition remaining or not
 * @param apiId
 * @param serverId
 * @returns {boolean}
 */
let isLastRepetition = (apiId, serverId) => {
	let isLastTest = false;
	let APIStatus = getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			return api.servers.some((server) => {
				if (server.name === serverId) {
					isLastTest = (server.repetitionsRemaining === 1);
				}
			})
		}
	});
	return isLastTest;
};

/**
 * Take a modified APIStatus object,
 * update all the progresses attributes and
 * write it in APIStatus.json file, replacing it
 * @param data an APIStatus object
 */
let writeAPIStatus = (data) => {
	let APIStatus = {APIStatus: data};
	updateAPIProgress(APIStatus);
	APIStatus = JSON.stringify(APIStatus);
	fs.writeFileSync(path.join(__dirname, 'APIStatus.json'), APIStatus);
};

/**
 * Browse all API and update their progress attribute by adding all server.progress attributes
 * @param APIStatus
 */
let updateAPIProgress = (APIStatus) => {
	Object.values(APIStatus.APIStatus).map((api) => {
		api.progress = (Object.values(api.servers)).reduce((accum, server) => {
			return accum + server.progress;
		}, 0);
		api.totalProgress = (Object.values(api.servers)).reduce((accum, server) => {
			return accum + server.totalProgress;
		}, 0);
	})
};

/**
 * Return a new, unused ID, for a new API
 * @param APIStatus
 * @returns {number}
 */
let getNewApiId = (APIStatus) => {
	let apiIds = APIStatus.map((api) => api.id);
	for (let i = 0; i <= Math.max(...apiIds) + 1; i++) {
		if (!apiIds.includes(i)) return i;
	}
	return 0;
};

/**
 * Add a new API to APIStatus and initiate its attributes
 * @param newApi
 * @returns {Promise<number>}
 */
let addApi = async (newApi) => {
	let APIStatus = getAPIStatus();
	let id = getNewApiId(APIStatus);
	let apiObj = {
		id: id,
		name: newApi.host,
		httpRequests: newApi.httpRequests,
		servers: [],
		progress: 0,
		totalProgress: 0,
		uptimeResults: {},
	};
	APIStatus.push(apiObj);
	writeAPIStatus(APIStatus);
	return id;
};

/**
 * Delete an existing API in APIStatus
 * @param apiId
 */
let deleteApi = (apiId) => {
	let APIStatus = getAPIStatus();
	let apiToDelete;
	APIStatus.forEach((api) => {
		if (api.id === apiId) {
			api.servers.forEach((server) => {
				GCPFunc.deleteVM(server.zone, server.name);
			});
			apiToDelete = api;
		}
	});
	APIStatus.remove(apiToDelete);
	writeAPIStatus(APIStatus);
};

/**
 * Build an OpenAPITestConfiguration out of an existing API, according to the OpenAPI Extension Proposal
 * @param api
 */
let createOpenAPIConfigurationFile = (api) => {
	let exportConfigObject = {};
	let latency = api.testConfig.latency;
	let uptime = api.testConfig.uptime;
	exportConfigObject.latency = {
		repetitions: latency.repetitions,
		interval: latency.interval.iso8601format,
		parameterDefinitionStrategy: latency.parameterDefinitionStrategy,
		timeoutThreshold: latency.timeoutThreshold
	};
	exportConfigObject.latency.zones = latency.zones.map(zone => {
		//TODO In future, if multiple providers are used, modify this part to fit to the configuration
		return {regionId: zone, provider: 'GCP'};
	});
	exportConfigObject.uptime = {
		repetitions: api.testConfig.uptime.repetitions,
		interval: api.testConfig.uptime.interval.iso8601format,
		timeoutThreshold: latency.timeoutThreshold
	};
	exportConfigObject.uptime.zones = uptime.zones.map(zone => {
		//TODO In future, if multiple providers are used, modify this part to fit to the configuration
		return {regionId: zone, provider: 'GCP'};
	});
	// fs.writeFileSync(path.join(__dirname, 'openapi-' + apiId + 'Configuration.json'), exportConfigObject);
};

/**
 *    Assign an OpenAPITestConfiguration to an API
 * @param apiId
 * @param config
 */
let addOpenApiTestConfigToApi = (apiId, config) => {
	let APIStatus = getAPIStatus();
	APIStatus.forEach(api => {
		if (api.id === apiId) {
			api.testConfig = config;
			//TODO THIS IS DEFAULT VALUE THAT MAY BE ASKED TO THE USER FOR A DEFINED ONE IN FUTURE VERSIONS
			api.testConfig.latency.parameterDefinitionStrategy = "provided";
			api.testConfig.latency.timeoutThreshold = 10000;
			api.testConfig.uptime.timeoutThreshold = 10000;
			createOpenAPIConfigurationFile(api);
		}
	});

	writeAPIStatus(APIStatus);
};

/**
 * Create all the Slaves needed for an API, based on its OpenAPITestConfiguration
 * @param apiId
 */
let createServerInstancesFromOpenApiTestConfig = (apiId) => {
	let APIStatus = getAPIStatus();
	APIStatus.forEach((api) => {
		if (apiId === api.id) {
			let latencyExecutionType = determineExecutionType(api.testConfig.latency);
			let uptimeExecutionType = determineExecutionType(api.testConfig.uptime);
			api.servers.push(...createServerInstance(api.testConfig.latency, apiId, "latency", latencyExecutionType));
			api.servers.push(...createServerInstance(api.testConfig.uptime, apiId, "uptime", uptimeExecutionType));
		}
	});
	writeAPIStatus(APIStatus);
};

/**
 * Return whether a Slave should be slaveHandled or masterHandled
 * @param config
 * @returns {string}
 */
let determineExecutionType = (config) => {
	let minuteOfMinimumDelay = EXECUTION_TYPE_TRESHOLD_MINUTE;
	let duration = config.interval.iso8601format;
	let formattedDuration = Duration.fromISO(duration);
	let milliseconds = formattedDuration.valueOf();
	if (milliseconds > (minuteOfMinimumDelay * 60000)) {
		return "masterHandled"
	} else {
		return "slaveHandled"
	}
};

/**
 * Create a Slave on GCP servers based on the OpenAPITestConfiguration, the testType and the executionType.
 * @param config
 * @param apiId
 * @param testType
 * @param executionType
 * @returns {Array}
 */
let createServerInstance = (config, apiId, testType, executionType) => {
	let gcpServerList = GCPFunc.getListOfZones();
	let servers = [];
	for (let server of config.zones) {
		let randomZone = gcpServerList[server].zones[Math.floor(Math.random() * gcpServerList[server].zones.length)];
		let zoneName = `${server}-${randomZone}`;
		let vmName = `api-${apiId}-${zoneName}-${testType}`;
		servers.push({
			name: vmName,
			testType: testType,
			executionType: executionType,
			region: server,
			zone: zoneName,
			location: gcpServerList[server].location,
			status: "Creating VM...",
			state: 'creating',
			substate: 'waiting',
			progress: 1,
			totalProgress: 1,
			repetitionsRemaining: config.repetitions
		});
		GCPFunc.createVM(zoneName, vmName);
	}
	return servers;
};

/**
 * Update server status
 * @param apiId
 * @param serverName
 * @param status
 */
let updateServerStatus = (apiId, serverName, status) => {
	applyFunctionToOneServer(apiId, serverName, (_, server) => server.status = status);
};


/**
 * Update server status, progress and totalProgress
 * @param apiId
 * @param serverName
 * @param newServer
 */
let updateServerInfos = (apiId, serverName, newServer) => {
	applyFunctionToOneServer(apiId, serverName, (_, server) => {
		server.status = newServer.status;
		server.progress = newServer.progress;
		server.totalProgress = newServer.totalProgress;
	});
};

/**
 * Initialize server information as testing state, according to the OpenAPITestConfiguration
 * @param apiId
 * @param serverName
 */
let initializeServerInfoForTestingState = (apiId, serverName) => {
	applyFunctionToOneServer(apiId, serverName, (api, server) => {
		server.status = "Testing...";
		server.progress = 0;
		if (server.testType === 'latency') {
			server.totalProgress = api.httpRequests.length * api.testConfig[server.testType].repetitions;
		} else if (server.testType === 'uptime') {
			server.totalProgress = api.testConfig[server.testType].repetitions;
		}
		server.repetitionsRemaining = api.testConfig[server.testType].repetitions;
	});
};




/**
 * Runs a callback function on a particular server, giving the API's id and the server's name
 * @param apiId
 * @param serverName
 * @param fn
 */
let applyFunctionToOneServer = (apiId, serverName, fn) => {
	let APIStatus = getAPIStatus();
	let newAPIStatus = APIStatus.map(api => {
		if (api.id === apiId) {
			api.servers.map(server => {
				if (server.name === serverName) {
					fn(api, server);
				}
				return server;
			})
		}
		return api;
	});
	writeAPIStatus(newAPIStatus);
};


/**
 * Save a new record to the proper operation test results attribute
 * @param apiId
 * @param slaveName
 * @param httpRequestIndex
 * @param testResult
 */
let saveLatencyRecord = (apiId, slaveName, httpRequestIndex, testResult) => {
	let APIStatus = getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			if (api.httpRequests[httpRequestIndex] && api.httpRequests[httpRequestIndex].testResults) {
				if (!api.httpRequests[httpRequestIndex].testResults[slaveName]) {
					api.httpRequests[httpRequestIndex].testResults[slaveName] = {
						latencyRecords: []
					}
				}
				let testRecords = api.httpRequests[httpRequestIndex].testResults[slaveName];
				testRecords.avgSuccess = ((testRecords.avgSuccess * testRecords.latencyRecords.length) + testResult.success) / (testRecords.latencyRecords.length + 1);
				testRecords.latencyRecords.push(...testResult.latencyRecords);
				testRecords.totalTest = testRecords.latencyRecords.length;
				testRecords.meanLatency = (testRecords.latencyRecords.reduce((accum, record) => {
					return accum + record.latencyMs;
				}, 0) / testRecords.totalTest).toFixed(2);
			} else {
				api.httpRequests[httpRequestIndex].testResults = {};
				api.httpRequests[httpRequestIndex].testResults[slaveName] = testResult;
			}
			return true;
		}
	});
	writeAPIStatus(APIStatus);
};

/**
 * Save a new Uptime record in proper API
 * @param apiId
 * @param serverName
 * @param isApiUp
 * @param date
 */
let saveUptimeRecord = (apiId, serverName, isApiUp, date) => {
	let APIStatus = getAPIStatus();
	APIStatus.some(api => {
		if (api.id === apiId) {
			if (api.uptimeResults[serverName]) {
				api.uptimeResults[serverName].push({date: date, state: isApiUp});
			} else {
				api.uptimeResults[serverName] = [];
				api.uptimeResults[serverName].push({date: date, state: isApiUp});
			}
		}
	});
	writeAPIStatus(APIStatus);
};


module.exports = {
	getAPIStatus: getAPIStatus,
	writeAPIStatus: writeAPIStatus,
	addApi: addApi,
	deleteApi: deleteApi,
	addOpenApiTestConfigToApi: addOpenApiTestConfigToApi,
	createServerInstanceFromOpenApiTestConfig: createServerInstancesFromOpenApiTestConfig,
	updateServerStatus: updateServerStatus,
	updateServerInfos: updateServerInfos,
	initializeServerInfoForTestingState: initializeServerInfoForTestingState,
	updateOperationTestResults: saveLatencyRecord,
	isLastTest: isLastRepetition,
	getLatencyInterval: getLatencyInterval,
	getUptimeInterval: getUptimeInterval,
	getAPI: getAPI,
	getServer: getServer,
	applyFunctionToOneServer: applyFunctionToOneServer,
	recordAPIUpTime: saveUptimeRecord,
	getHTTPRequest: getHTTPRequest
};
