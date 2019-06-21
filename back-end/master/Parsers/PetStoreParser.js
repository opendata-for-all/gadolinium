let SwaggerParser = require('swagger-parser');

class PetStoreParser {

	static async parse() {
		return [
			{
				"operationId": "addPet",
				"method": "post",
				"headers": {
					"Content-Type": "application/json"
				},
				"params": {},
				"url": "https://petstore.swagger.io/v2/pet",
				"data": {
					"id": 0,
					"category": {
						"id": 0,
						"name": "string"
					},
					"name": "doggie",
					"photoUrls": [
						"string"
					],
					"tags": [
						{
							"id": 0,
							"name": "string"
						}
					],
					"status": "available"
				}
			},
			{
				"operationId": "updatePet",
				"method": "put",
				"headers": {
					"Content-Type": "application/json"
				},
				"params": {},
				"url": "https://petstore.swagger.io/v2/pet",
				"data": {
					"id": 0,
					"category": {
						"id": 0,
						"name": "string"
					},
					"name": "doggie",
					"photoUrls": [
						"string"
					],
					"tags": [
						{
							"id": 0,
							"name": "string"
						}
					],
					"status": "available"
				},
			},
			{
				"operationId": "findPetsByStatus",
				"method": "get",
				"headers": {},
				"params": {
					"status": "sold"
				},
				"url": "https://petstore.swagger.io/v2/pet/findByStatus"
			},
			{
				"operationId": "getPetById",
				"method": "get",
				"headers": {},
				"params": {},
				"url": "https://petstore.swagger.io/v2/pet/2"
			},
			{
				"operationId": "updatePetWithForm",
				"method": "post",
				"headers": {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				"params": {
					"petId": 2,
					"name": "Plus trop name 2",
					"status": "sold"
				},
				"url": "https://petstore.swagger.io/v2/pet/87"
			},
			{
				"operationId": "deletePet",
				"method": "delete",
				"headers": {},
				"params": {},
				"url": "https://petstore.swagger.io/v2/pet/51"
			},
			{
				"operationId": "getInventory",
				"method": "get",
				"headers": {},
				"params": {},
				"url": "https://petstore.swagger.io/v2/store/inventory"
			},
			{
				"operationId": "placeOrder",
				"method": "post",
				"headers": {},
				"params": {},
				"url": "https://petstore.swagger.io/v2/store/order",
				"data": {
					"id": 0,
					"petId": 0,
					"quantity": 0,
					"shipDate": "2019-06-19T09:57:24.057Z",
					"status": "placed",
					"complete": false
				}
			},
			{
				"operationId": "getOrderById",
				"method": "get",
				"headers": {},
				"params": {},
				"url": "https://petstore.swagger.io/v2/store/order/2"
			},
			{
				"operationId": "deleteOrder",
				"method": "delete",
				"headers": {},
				"params": {},
				"url": "https://petstore.swagger.io/v2/store/order/2"
			},
			{
				"operationId": "createUser",
				"method": "post",
				"headers": {},
				"params": {},
				"url": "https://petstore.swagger.io/v2/user",
				"data": {
					"id": 0,
					"username": "string",
					"firstName": "string",
					"lastName": "string",
					"email": "string",
					"password": "string",
					"phone": "string",
					"userStatus": 0
				}
			},
			{
				"operationId": "createUsersWithArrayInput",
				"method": "post",
				"headers": {},
				"params": {},
				"url": "https://petstore.swagger.io/v2/user/createWithArray",
				"data": [
					{
						"id": 0,
						"username": "string",
						"firstName": "string",
						"lastName": "string",
						"email": "string",
						"password": "string",
						"phone": "string",
						"userStatus": 0
					}
				]
			},
			{
				"operationId": "createUsersWithListInput",
				"method": "post",
				"headers": {},
				"params": {},
				"url": "https://petstore.swagger.io/v2/user/createWithList",
				"data": [
					{
						"id": 0,
						"username": "string",
						"firstName": "string",
						"lastName": "string",
						"email": "string",
						"password": "string",
						"phone": "string",
						"userStatus": 0
					}
				]
			},
			{
				"operationId": "loginUser",
				"method": "get",
				"headers": {},
				"params": {
					"username": "dsds",
					"password": "sdqdqs"
				},
				"url": "https://petstore.swagger.io/v2/user/login"
			},
			{
				"operationId": "logoutUser",
				"method": "get",
				"headers": {},
				"params": {},
				"url": "https://petstore.swagger.io/v2/user/logout"
			},
			{
				"operationId": "getUserByName",
				"method": "get",
				"headers": {},
				"params": {},
				"url": "https://petstore.swagger.io/v2/user/1"
			},
			{
				"operationId": "deleteUser",
				"method": "delete",
				"headers": {},
				"params": {},
				"url": "https://petstore.swagger.io/v2/user/EyFjsrgaXH"
			}
		];
	}
}

module.exports = PetStoreParser;
