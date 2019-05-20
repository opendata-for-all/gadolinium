let apisDom = {};
let serverDivsDom = {};
let serversDom = {};

let submitServerForAPITest = () => {
	let gcpServerList = document.getElementById('GCPServers');
	let regions = serversSelected;
	let data = {
		apiId : apiSelected,
		regions : regions
	};
	client.emit('newServerToTest', data);
	// prepareModalForServerSelection();
};

let clickOnApi = (apiId) => {
	apiSelected = apiId;
	makeAddServerButtonAppear();
	removeActiveClassFromAllApis();
	displaySelectedApiAsActive(apiId);
	displayServerList(apiId);
	getServerList(apiId);
};

function displayAvailableServers(gcpServerList) {
	Array.from(gcpServerList.children).map((server) => {
		if (APIStatus[apiSelected].servers[server.getAttribute('gcpregion')]) server.style.display = 'none';
		else server.style.display = 'block';
	})
}

function removeActiveClassFromServers(gcpServerList) {
	Array.from(gcpServerList.children).map((server) => {
		server.classList.remove('active');
	});
}

function setSubmitButtonDisabled() {
	let submitButton = document.getElementById('submitServers');
	submitButton.setAttribute('disabled', '');
}

let prepareModalForServerSelection = () => {
	setSubmitButtonDisabled();
	let gcpServerList = document.getElementById('GCPServers');
	removeActiveClassFromServers(gcpServerList);
	displayAvailableServers(gcpServerList);
};

let addServerToSelectedServerList = (region) => {
	serversSelected.push(region);
};

let removeServerFromSelectedServerList = (region) => {
	let index = serversSelected.indexOf(region);
	if (index > -1) serversSelected.splice(index, 1)
};

let setActiveClassForClickedServerButtons = (button) => {
	if (!button.classList.contains('active')) {
		addServerToSelectedServerList(button.getAttribute('gcpregion'));
		button.classList.remove('btn-outline-primary');
		button.classList.add('btn-success');
		button.classList.add('active');
	} else {
		removeServerFromSelectedServerList(button.getAttribute('gcpregion'));
		button.classList.remove('active');
		button.classList.remove('btn-success');
		button.classList.add('btn-outline-primary');
	}
};

let setActiveClassForSubmitServerListButton = () => {
	let submitButton = document.getElementById('submitServers');
	let atLeastOneServerSelected = serversSelected.length > 0;
	if (atLeastOneServerSelected) {
		submitButton.removeAttribute('disabled');
	} else {
		submitButton.setAttribute('disabled', '');
	}
};

let serverSelected = (button) => {
	setActiveClassForClickedServerButtons(button);
	setActiveClassForSubmitServerListButton();
};

let makeAddServerButtonAppear = () => {
	let addServerButton = document.getElementById('addServerDiv');
	addServerButton.style.display = 'block';
}

let addServerlistToHTML = (serverList) => {
	let el = document.getElementById('serverDiv');
	removeChildren(el);
	for (let server of serverList) {
		let newServerEl = document.createElement("a");
		newServerEl.setAttribute("class", "list-group-item list-group-item-action");
		newServerEl.setAttribute("onclick", ""); //TODO Nom de la fonction
		newServerEl.innerText = server.location;
		el.appendChild(newServerEl);
		console.log("Server Ajouté");
	}
};

let removeChildren = (element) => {
	while (element.lastChild) {
		element.removeChild(element.lastChild);
	}
};

let removeActiveClassFromAllApis = () => {
	let apiList = document.getElementById('apiDiv');
	Array.from(apiList.children).map((child) => {
		child.classList.remove("active");
	});
};
let displaySelectedApiAsActive = (apiId) => document.getElementById('api' + apiId).classList.add("active");

let hideAllServerLists = () => {
	let servers = Object.values(serverDivsDom);
	servers.map((server) => {
		server.setAttribute('style', 'display : none');
	});
};

let displaySelectedApiServerList = (apiId) => {
	if (serverDivsDom[apiId]) serverDivsDom[apiId].setAttribute('style', 'display : block');
}

let displayServerList = (apiId) => {
	hideAllServerLists();
	displaySelectedApiServerList(apiId);
};

let refreshApiElement = (apiId, api) => {
	if (apisDom[apiId]) {
		updateApiElement(apiId, api)
	} else {
		createApiElement(apiId, api)
	}
};

let updateApiElement = (apiId, api) => {
	apisDom[apiId].innerText = api.name;
};

let createApiElement = (apiId, api) => {
	let newApiElement = document.createElement('a');
	newApiElement.setAttribute('class', 'list-group-item list-group-item-action');
	newApiElement.setAttribute('id', 'api' + apiId);
	newApiElement.setAttribute('onclick', 'clickOnApi(' + apiId + ')');
	newApiElement.innerText = api.name;
	apisDom[apiId] = newApiElement;
	addNewApiElement(newApiElement);
};

let addNewApiElement = (newApiElement) => {
	document.getElementById('apiDiv').appendChild(newApiElement);
};

let updateServerElement = (serverId, server, apiId) => {
	let serverDiv = serversDom[serverId];
	serverDiv.pStatus.innerText = server.status;
	serverDiv.progressBar.element.style.width = server.progress / server.totalProgress * 100 + '%';
	serverDiv.progressBar.element.setAttribute('aria-valuenow', server.progress)
};

let createProgressBarElement = (serverId, server) => {
	let progressBarElement = document.createElement('div');
	progressBarElement.setAttribute('class', 'progress-bar progress-bar-striped progress-bar-animated bg-info');
	progressBarElement.setAttribute('role', 'progressbar');
	progressBarElement.setAttribute('aria-valuenow', server.progress);
	progressBarElement.setAttribute('aria-valuemin', 0);
	progressBarElement.setAttribute('aria-valuemax', server.totalProgress);
	let percentage = server.progress / server.totalProgress * 100;
	progressBarElement.setAttribute('style', 'width: ' + percentage + '%');
	return progressBarElement;
};

let createProgressBar = (serverId, server) => {
	let progressBar = document.createElement('div');
	progressBar.setAttribute('class', 'progress');
	progressBar.setAttribute('id', 'progressBar' + serverId);
	let progressBarElement = createProgressBarElement(serverId, server);
	progressBar.element = progressBarElement;
	progressBar.appendChild(progressBarElement);
	serversDom[serverId].progressBar = progressBar;
	return progressBar;
};

let createStatusAndNameDiv = (serverId, server) => {
	let row = document.createElement('div');
	row.setAttribute('class', 'row');
	let colStatus = document.createElement('div');
	colStatus.setAttribute('class', 'col');
	let colName = document.createElement('div');
	colName.setAttribute('class', 'col');
	let pStatus = document.createElement('p');
	pStatus.innerText = server.status;
	let pName = document.createElement('p');
	pName.innerText = server.location;
	colName.appendChild(pName);
	colStatus.appendChild(pStatus);
	row.appendChild(colName);
	row.appendChild(colStatus);
	serversDom[serverId].pStatus = pStatus;
	serversDom[serverId].pName = pName;
	return row;
};

let createServerElement = (serverId, server, apiId) => {
	let newServerElement = document.createElement('a');
	serversDom[serverId] = newServerElement;
	newServerElement.setAttribute('class', 'list-group-item list-group-item-warning');
	newServerElement.setAttribute('id', 'server' + serverId);
	newServerElement.appendChild(createStatusAndNameDiv(serverId, server));
	newServerElement.appendChild(createProgressBar(serverId, server));
	addNewServerElement(newServerElement, apiId);
};

let addNewServerElement = (newServerElement, apiId) => {
	if (serverDivsDom[apiId]) {
		serverDivsDom[apiId].appendChild(newServerElement);
	} else {
		let serverDiv = document.createElement('div');
		serverDiv.setAttribute('id', apiId + 'serverDiv');
		serverDiv.setAttribute('style', 'display : none');
		serverDiv.appendChild(newServerElement);
		serverDivsDom[apiId] = serverDiv;
		let serversDiv = document.getElementById('serverDiv');
		serversDiv.appendChild(serverDiv);
	}
};

let refreshServerElement = (serverId, server, apiId) => {
	if (serversDom[serverId]) {
		updateServerElement(serverId, server, apiId);
	} else {
		createServerElement(serverId, server, apiId);
	}
};

let refreshServerElements = (apiId, api) => {
	let serverIds = Object.keys(api.servers);
	for (let j = 0; j < serverIds.length; j++) {
		let serverId = serverIds[j];
		let server = api.servers[serverId];
		refreshServerElement(serverId, server, apiId);
	}
};

let createAPIStatusElements = (apis) => {
	for (let i = 0; i < apis.length; i++) {
		let apiId = apis[i][0];
		let api = apis[i][1];
		refreshApiElement(apiId, api);
		refreshServerElements(apiId, api);
	}
};

let deleteOldAPIStatus = (apiId) => {
	let apiDiv = apisDom[apiId];
	apiDiv.parentElement.removeChild(apiDiv);
	let serverDiv = serverDivsDom[apiId];
	serverDiv.parentElement.removeChild(serverDiv);
};

let deleteOldServer = (serverId) => {
	let serverDiv = serversDom[serverId];
	serverDiv.parentElement.removeChild(serverDiv);
};

let updateAPIStatusElement = (apiId, oldApi, newApi) => {
	let oldServersIds = Object.keys(oldApi.servers);
	let newServersIds = Object.keys(newApi.servers);
	if (newServersIds.length > oldServersIds.length) {
		newServersIds.filter((serverId) => {
			if (!oldServersIds.includes(serverId)) {
				createServerElement(serverId, newApi.servers[serverId], apiId);
			}
		})
	} else if (newServersIds.length < oldServersIds.length) {
		oldServersIds.filter((serverId) => {
			if (!newServersIds.includes(serverId)) {
				deleteOldServer(serverId);
			}
		})
	} else {
		oldServersIds.filter((serverId) => {
			if (!isEqual(oldApi.servers[serverId], newApi.servers[serverId])) {
				refreshServerElement(serverId, newApi.servers[serverId], apiId);
			}
		})
	}
};

let refreshAPIStatus = (newAPIStatus) => {
	if (APIStatus === null) {						//First time webclient receive APIStatus
		createAPIStatusElements(Object.entries(newAPIStatus));
	} else if (!isEqual(APIStatus, newAPIStatus)) {	//The new APIStatus is not the same as its own
		// let oldApiIds = Object.keys(APIStatus);
		// let newApiIds = Object.keys(newAPIStatus);
		// if (!oldApiIds.equals(newApiIds)) {			//Is there a new API added or deleted ?
		// 	APIStatus = newAPIStatus;
		// 	newApiIds.filter((id) => {
		// 		if (!oldApiIds.includes(id)) return id
		// 	}).map((id) => {
		// 		console.log(id);
		// 		refreshApiElement(id, newAPIStatus[id]);
		// 		refreshServerElements(id, newAPIStatus[id]);
		// 	});
		// } else if(){								//
		//
		// }
		let oldApisIds = Object.keys(APIStatus);
		let newApiIds = Object.keys(newAPIStatus);
		if (newApiIds.length > oldApisIds.length) { 				//An API has been added
			newApiIds.filter((apiId) => {
				if (!oldApisIds.includes(apiId)) {
					createAPIStatusElements([[apiId, newAPIStatus[apiId]]]);
				}
			});
		} else if (newApiIds.length < oldApisIds.length) {			//An API has been deleted
			oldApisIds.filter((apiId) => {
				if (!newApiIds.includes(apiId)) {
					deleteOldAPIStatus(apiId);
				}
			});
		} else {
			oldApisIds.filter((apiId) => {
				if (!isEqual(APIStatus[apiId], newAPIStatus[apiId])) {
					updateAPIStatusElement(apiId, APIStatus[apiId], newAPIStatus[apiId]);
				}
			})
		}
	}
	APIStatus = newAPIStatus;
};

let oldApi;
let newApi;