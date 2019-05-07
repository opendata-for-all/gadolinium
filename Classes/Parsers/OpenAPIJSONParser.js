class OpenAPIJSONParser {
	static parse(openAPIJSON) {
		function randomText(length) {
			let text = "";
			let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for (let i = 0; i < length; i++)
				text += possible.charAt(Math.floor(Math.random() * possible.length));
			return text;
		}

		function randomInt(min, max) {
			return min ? max ? (Math.floor(Math.random() * (max - min)) + min) : (Math.floor(Math.random() * (100 - min)) + min) : max ? Math.floor(Math.random() * (max)) : Math.floor(Math.random() * (100));
		}

		function getReferenceObject(schema, definitionObject) {
			let ref;
			if (schema.type === 'array') {
				ref = schema.items["$ref"];
			} else {
				ref = schema["$ref"];
			}
			ref = ref.split("/");
			ref = ref[ref.length - 1];
			return definitionObject[ref];
		}

		let addSchemaToBody = (schema, name, configObj) => {
			let propertyNames = Object.keys(schema.properties);
			let propertyTypes = Object.values(schema.properties);
			for (let i = 0; i < propertyNames.length; i++) {
				let propertyName = propertyNames[i];
				let propertyType = propertyTypes[i];
				let type = propertyType.type;
				if (schema.required) {
					if (schema.required.includes(propertyName)) {
						if (type === 'string') {
							configObj.data[propertyName] = randomText(12)
						} else if (type === 'integer') {
							configObj.data[propertyName] = randomInt();
						} else if (type === 'array') {
							configObj.data[propertyName] = [];
							if (propertyType.items.type === 'integer') configObj.data[propertyName].push(randomInt());
							else if (propertyType.items.type === 'string') configObj.data[propertyName].push(randomText());
						}
					}
				}
			}
		};


		let configureAParamInBody = (configObj, reqObj, param, definitionObject) => {
			configObj.data = {};
			let name = param.name;
			let schema = getReferenceObject(param.schema, definitionObject);
			let isSchemaArray = Array.isArray(schema);
			if (isSchemaArray) schema = schema[0];
			if (schema.type === 'object') {
				addSchemaToBody(schema, name, configObj);
			} else if (isSchemaArray) {
				configObj.data[name] = [configObj.data[name]];
			}
		};

		let configureAParamInPath = (configObj, reqObj, param) => {
			if (param.required) {
				if (param.type === 'integer') {
					let randomInteger = randomInt(param.minimum, param.maximum);
					configObj.url = configObj.url.replace("{" + param.name + "}", randomInteger);
				} else if (param.type === 'string') {
					configObj.url = configObj.url.replace("{" + param.name + "}", randomText(10));
				}
			}
		};

		let configureAParamInQuery = (configObj, reqObj, param) => {
			if (param.required) {
				if (param.type === 'integer') {
					configObj.params[param.name] = randomInt(param.minimum, param.maximum);
				} else if (param.type === 'string') {
					configObj.params[param.name] = randomText(10);
				}
			}
		};

		let configureContentType = (configObj, reqObj) => {
			if (reqObj.consumes) configObj.headers["Content-Type"] = reqObj.consumes[0];
		};

		let configureParameters = (configObj, reqObj, url, definitionObject) => {
			let params = reqObj.parameters;
			configObj.url = url;
			if (params) {
				for (let param of params) {
					switch (param.in) {
						case 'body' :
							configureAParamInBody(configObj, reqObj, param, definitionObject);
							break;
						case 'path' :
							configureAParamInPath(configObj, reqObj, param);
							break;
						case 'query' :
							configureAParamInQuery(configObj, reqObj, param);
					}
				}
			}
		};

		let setUpHttpRequest = (reqType, reqObj, url, definitionObject) => {
			let configObj = {};
			configObj.method = reqType;
			configObj.headers = {};
			configObj.params = {};
			configureContentType(configObj, reqObj);
			configureParameters(configObj, reqObj, url, definitionObject);
			return configObj;

		};

		let getUrlToQuery = (pathName, host, basePath, schemes) => {
			return schemes[0].concat('://').concat(host).concat(basePath).concat(pathName);
		};

		let getHTTPRequestsFromPath = (pathName, pathObject, host, basePath, schemes, definitionObject) => {
			let urlToQuery = getUrlToQuery(pathName, host, basePath, schemes);
			let requestTypes = Object.keys(pathObject);
			let pathsRequest = [];
			for (let i = 0; i < requestTypes.length; i++) {
				pathsRequest.push(setUpHttpRequest(requestTypes[i], pathObject[requestTypes[i]], urlToQuery, definitionObject));
			}
			return pathsRequest;
		};

		let host = openAPIJSON.host;
		let basePath = openAPIJSON.basePath;
		let schemes = openAPIJSON.schemes;
		let paths = openAPIJSON.paths;
		let pathNames = Object.keys(paths);
		let pathObjects = Object.values(paths);
		let definitionObject = openAPIJSON.definitions;
		let requests = [];
		for (let i = 0; i < pathNames.length; i++) {
			requests.push(...getHTTPRequestsFromPath(pathNames[i], pathObjects[i], host, basePath, schemes, definitionObject));
		}
		return requests;
	}
}

module.exports = OpenAPIJSONParser;