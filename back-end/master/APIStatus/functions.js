let fs = require('fs');
let path = require('path');
let GCPFunc = require('../GoogleCloudManagement/functions');

let getAPIStatus = () => {
	let APIStatus = fs.readFileSync(path.join(__dirname, 'APIStatus.json'));
	return JSON.parse(APIStatus).APIStatus;
};

let writeAPIStatus = (data) => {
	let APIStatus = {APIStatus: data};
	updateAPIProgress(APIStatus);
	APIStatus = JSON.stringify(APIStatus);
	fs.writeFileSync(path.join(__dirname, 'APIStatus.json'), APIStatus);
};

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

let getNewApiId = (APIStatus) => {
	let apiIds = APIStatus.map((api) => api.id);
	for (let i = 0; i <= Math.max(...apiIds) + 1; i++) {
		if(!apiIds.includes(i)) return i;
	}
};

let addApi = (newApi) => {
	let APIStatus = getAPIStatus();
	let id = getNewApiId(APIStatus);
	APIStatus.push({
		id: id,
		name: newApi.host,
		httpRequests: newApi.httpRequests,
		servers: [],
		progress: 0,
		totalProgress: 0
	});
	writeAPIStatus(APIStatus);
};

let deleteApi = (apiId) => {
	let APIStatus = getAPIStatus();
	APIStatus.forEach((api) => {
		if (api.id === apiId) {
			api.servers.forEach((server) => {
				GCPFunc.deleteVM(server.zone, server.name);
			});
		}
	});
	APIStatus.remove(APIStatus[apiId]);
	writeAPIStatus(APIStatus);
};

let addServers = (apiId, servers) => {
	let APIStatus = getAPIStatus();
	APIStatus.map((api) => {
		if (api.id === apiId) {
			api.servers = [...api.servers, ...servers];
		}
		return api;
	});
	writeAPIStatus(APIStatus);
};

let deleteServer = (apiId, serverName) => {
	let APIStatus = getAPIStatus();
	for (let i = 0; i < APIStatus.length; i++) {
		if (APIStatus[i].id === apiId) {
			for (let j = 0; j < APIStatus[i].servers.length; j++) {
				let server = APIStatus[i].servers[j];
				if (server.name === serverName) {
					GCPFunc.deleteVM(server.zone, server.name);
					APIStatus[i].servers.remove(APIStatus[i].servers[j]);
				}
			}
		}
	}
	writeAPIStatus(APIStatus);
};

let updateServerStatus = (apiId, serverName, status) => {
	let APIStatus = getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			api.servers.forEach((server) => {
				if (server.name === serverName) {
					server.status = status;
					return true;
				}
			});
			return true;
		}
	});
	writeAPIStatus(APIStatus)
};

let updateServerInfos = (apiId, serverName, newServer) => {
	let APIStatus = getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			api.servers.forEach((server) => {
				if (server.name === serverName) {
					server.status = newServer.status;
					server.progress = newServer.progress;
					server.totalProgress = newServer.totalProgress;
					return true;
				}
			});
			return true;
		}
	})
	writeAPIStatus(APIStatus)
};

module.exports = {
	getAPIStatus: getAPIStatus,
	writeAPIStatus: writeAPIStatus,
	addApi: addApi,
	deleteApi: deleteApi,
	addServers: addServers,
	deleteServer: deleteServer,
	updateServerStatus: updateServerStatus,
	updateServerInfos, updateServerInfos
};
