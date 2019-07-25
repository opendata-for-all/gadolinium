# What is Gadolinium ?

## Overall presentation

Gadolinium is a tool which allows testing non-functional properties of an OpenAPI described API, display in charts and exporting such test results as another OpenAPI Specifications file, extended by the non-functional properties OpenAPI Extension.  
The particularity of this tool is the architecture employed for the process of testing an API. Because it is relevant to test the API from different part of the world, the tool uses a Master-Slave architecture, in which the Master controls and manages the Slaves which are testing the API.  
Thus, the tool relies on an external hosting service provider (such as Google Cloud Platform, Azure from Microsoft or Amazon Web Services) which is capable of quickly providing an instance of server in order to run the tool.  
There is 2 different part in this tool, the back-end with all the Slaves and testing management, coded in NodeJS, and the front-end which displays a dashboard.

## The different actors in Gadolinium's interaction

By the nature of this tool, multiple actors communicate with each other in the process of testing API’s, there are :
-	The User, which uses the tool in order to test an API.
-	The Master, which is the server directly communicating with the User and creating the Slaves.
-	The Slaves, which are the servers testing the API and sending the results to the Master.
-	The API, which is tested by the tool and defined by an OpenAPI Specification file.
-	A service provider, which hosts and runs the Master and the Slaves.

## The Master-Slave architecture

### Motivations

When we talk about non-functional properties, such as latency and uptime, it often relies on the geographical location. When we perform a simple ICMP ping to a server, this request *physically* travels through cables to reach its destination. So, the latency of a request to a server located in Paris will be a lot shorter from Lille than Hong Kong.  
Thus, our testing tool must be *physically* running on different location around the world. That's why there is a need of a **Cloud service provider**.

### How it works

The Master is directly in contact with the User through the front-end interface but not with the tested API's. It controls the Slaves in there manner of testing the API's.  
The Slaves are individual dynamic instance running a special program so as to test the API, so it is these which directly interact with the API's.

**_[Inject Architecture Figure]_**

## The visible part : the dashboard

API testing means measurement, measurement means charts and data visualization.

**_[Inject Screenshot]_**

# Definitions

## What is an API

From our point of view, the definition of an API is not the same as OpenAPI Specification one. It is a dynamic entity which, from it's initial state, evolves as the process of testing progresses.  
Its initial state is set when an OpenAPI file, with an OpenAPI Test Configuration 

>To be finish

## What is a Slave

In the Master-Slaves architecture, the Slave is the entity in charge of testing an API from a determined region of the world. The Slave is managed and controlled by the Master, and since they are not continuously connected, it is necessary to define multiple state of a Slave. Also, a Slave is defined by its *execution type* and its *test type*.

Before that, it is important to note that *the Master is the only program interacting with the cloud service provider in order to create, start, stop and delete instances on which runs the Slave*.

Now, back to Slave's definition. 

#### Execution type
The execution type defines if the Slave will have to manage itself during all the process of testing the API or not.  
To explain this notion, I'll take an example, remember that Slaves run on cloud service provider servers which is not free, these providers can even bill the number of seconds of usage. If we want to test the uptime of an API every day at 5pm, the Slave will run a test once in the day, and be on standby during 23 hours and 59 seconds. This time will be billed by the provider, so it is necessary to shut down the instance, and restart it at a certain time in order to run the test. In contrary, considering a start-up time of an instance and the Slave is 2 minutes, then checking the uptime of an API every minute will be impossible, the instance needs to stay up and run continuously.

These 2 cases defines 2 different execution type :
* **SlaveHandled** :  The Slave doesn't shut down between each repetition (cf. OpenAPI Extension Proposal). So it manages itself during all the process of testing.
* **MasterHandled** : The Slave is fully controlled by the Master. The Master decides when to turn on the Slave to proceed to a test repetition, and shuts it down after it.

The threshold time of interval between repetitions to change execution type from SlaveHandled to MasterHandled has been set at 10 minutes, which is arbitrary and can be changed in case of cost efficiency need.

#### Test type

The test type defines the type of test the Slave will perform and is necessary for the Master to differentiate between a Latency testing Slave and an Uptime testing Slave. The reason is that when a Slave connects to the Master, it identifies itself with the name of a region and the zone, and if a Latency test and an Uptime test are running on the same region and zone, it needs to be differentiated in order to Master send the proper information to the Slave.  
So, there are as many test type as different non-functional properties the tool support testing, which is for now 2 : **Latency** and **Uptime**

#### State

The state defines whether a Slave is running the testing process or not. There are 3 different state for a Slave :
 * **Creating** : The instance on cloud service provider's datacenter is being created and starting up, and the Slave, once the boot-up script finished, will _connect to the Master for the first time_.
 * **Testing** : The Slave established a connection with the Master. It is currently running tests on the API. It is not necessarily connected to the Master (see substates for more information).  
 * **Completed** : The Slave finished all its assigned test according to the Test Configuration and is not useful anymore, its instance on the cloud service provider will simply be deleted by the Master.
 
##### Substates of 'Testing' state

In the case of a _MasterHandled_ Slave, Master and Slave are not continuously connected, because Slave is often turned off and on during the process of testing. During the 'Testing' it is necessary to add an other level of abstraction whether the Slave is currently off, waiting for the next repetition of test, or it is currently booting up, getting ready for the next repetition, or it is currently running this repetition.  
These are the 3 different 'substates' of 'Testing' state :

* **Waiting** : This substate defines a Slave waiting for its next repetition. It is off, and is waiting for the Master to turn it on again in order to run the next repetition.

* **Booting** : This substate defines a Slave between the moment the Master commanded for its startup, and the moment it connects again to the Master.

* **Recording** : This state defines a Slave that just received the information about the test it is supposed to run and is currently sending records to Master.

In the case of a _SlaveHandled_ Slave, under Testing state, **it is always in  Recording state**

Here is a figure to understand the changes of a Slave state in the case of a _MasterHandled_ and _Latency_ Slave :

**_[Inject Slave State Figure]_**

Here is an other figure in case of a _SlaveHandled_ and _Uptime_ Slave : 

**_[Inject Slave State Figure]_**

The upright lines on the right represent the different states of the Slave

## What is an OpenAPI Test Configuration

An OpenAPI Test Configuration refers directly to the OpenAPI Extension proposal. It describes different parameters which will determine the process of testing an API. For this first version, it supports the same two *test types* which are **Latency** and **Uptime**. See the OpenAPI Extension Proposal for more information : 

**_[Insert OpenAPI Extension Link]_**

# Technology choices

A tool using a such architecture implies to use existing libraries and technologies in order to complete its mission. In this part we will discuss these technology choices.

## Back-end

**NodeJS** : The use of this technology is fostered by the fact that the tool primarily hosts information that needs to be reached by external (User or Slaves). Also, the easiness of the deployment of an HTTP Server with this language is a strong argument compared to the complexity, formality and rigorousness of a Java deployed HTTP Server. Another argument is the enormous amount of resources and libraries (modules) in NodeJS which are easy to import (Node Packet Manager, NPM and the package.json file) and use.

**ExpressJS framework** : This library is a NodeJS framework which acts as a RequestHandler in order to handle and manage API endpoints. It already handles requests errors (404 for example) and allows easy management of endpoints and responses to requests thanks to middlewares. Also, it can be simply deployed using the ‘createServer’ method of http module and it listens to incoming requests.

**SocketIO** : This library is what allows communication between actors of this tool via WebSockets. It is preferred to WebSocket library because, in general, it allows more easily and intuitively the connections between the server and clients. For instance, it allows to create ‘Rooms’ which can be allocated to a certain type of client, for example, when a Slave performed a test, in order to alert all users browsing on the tool, we will simply alert all clients connected to ‘webclient’ room instead of sending to each clients one by one. Moreover, documentation around this library seems more extensive. Another argument is discussed in the Front-end part.

## Front-end

**Angular** : Having a dashboard in order to visualize and exports test results was a requirement in the tool. Thus, selecting an API among multiple, displaying the Slaves status and progression and Charts aggregated with the data implies to manipulate the HTML DOM. Manipulating this object ‘manually’ with its own JS functions at this scale is highly risky and unreliable. This approach fosters the usage of a framework in order to abstract the DOM manipulation and only act on the behavior and the data. The choice of Angular is purely arbitrary, it could have been React.

**SocketIO** : The argument, which is not discussed in Back-end part, is that SocketIO provides a simple and intuitive API to configure a connection and handle the events. Providing a configuration object in the AppModule of the Angular project is enough, then each services can focus on certain events for their own purpose.

**C3** : This is a Chart generation and manipulation library, it is based on D3 library. This choice is arbitrary, it could have been ChartJS.

# Code architecture and Documentation

## Back-end

In this part, we will add documentation about back-end part of the tool, which contains **Master** and **Slaves**, these following will be documented : 
* Overall code architecture description
* The presentation of the APIStatus file
* The Master-Slave Socket connection protocol
* The Master event sequence at startup
* The relations with front-end
* The code fragments

### Code Architecture

The back-end runs on NodeJS, an HTTP Server which contains an Express Application handling all endpoints and a Socket Server handling all real-time messages.

**_[Insert Master Architecture Figure]_**

There are not many endpoints and socket events but enough to make Slaves and front-end working as the tool should.

#### Master startup protocol

When launched, there a sequence of event occurring before the service is accessible :
1. In case of crash/reboot instead of an initial boot, it is necessary to restore the state of Slaves and data used before this crash/reboot. The Master gather all the informations it was supposed to be aware of before its crash/restart in the APIStatus file which will be explained in the next part, but the main information would be :
  * All API’s being tested, so it needs to gather informations about these API’s such as its general infos (name, etc)
  * the Slaves currently testing an API and their state in the process of testing, so it needs to allow the Socket reconnection of these Slaves (explained below).
2. Creation a new Express application so as to manage its endpoints for usage and handle requests.
  * It enables CORS (required for Angular usage), the parsing of JSON in requests, etc…
  * It creates all endpoints (see below for endpoints explanations)
3.	Embodiment of this created Express application in an HTTP Server.
4. Creation of the socket server, with the HTTP Server, which, on connection, discriminates two type of connection :
 * WebClient : Create a necessary connection which is necessary for Front-End Angular work.
 * SlaveClient : Allow connection based on the name of the Slave.
5. Start the HTTP Server.

### APIStatus file

The APIStatus file is the center of the tool, this is where all API's to be tested, results of test of these API's, etc...  
This file is a list of these API. An API, in this context, is a dynamic object describing a real API and the progress of its testing.

An API is described as follows :
* A name, which is simple the baseUrl of the OpenAPI Specification file sent.
* A list of HTTP requests to be tested, which come directly from the list of operations present in the OpenAPI file
* The list of servers which are testing the API
* The results of **Uptime** tests.
* The OpenAPI Test Configuration
* The current progress of test which is the number of steps done since the beginning of the test, and its total progress which is the total number of steps.

#### HTTP Request Objects

As said, it's a dynamic object, it is initialized with the sending of an OpenAPI Specification file from the User, from this file, a Parser will be used in order to retrieve all the operations, and transform these as HTTP requests objects used by HTTP Request Sending libraries.  
The transformation looks like this figure :

**This is an OpenAPI Specification described operation** :

```json
"/pet": {
  "post": {
    "tags": [
      "pet"
    ],
    "summary": "Add a new pet to the store",
    "description": "",
    "operationId": "addPet",
    "consumes": [
      "application/json",
      "application/xml"
    ],
    "produces": [
      "application/xml",
      "application/json"
    ],
    "parameters": [
      {
        "in": "body",
        "name": "body",
        "description": "Pet object that needs to be added to the store",
        "required": true,
        "schema": {
          "$ref": "#/definitions/Pet"
        }
      }
    ],
    "responses": {
      "405": {
        "description": "Invalid input"
      }
    },
    "security": [
      {
        "petstore_auth": [
          "write:pets",
          "read:pets"
        ]
      }
    ]
  },
}
``` 

**This is the corresponding HTTP Request object** :

```json
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
  },
  "testResults": {
    "api-0-asia-northeast1-b-latency": {
      "latencyRecords": [
        {
          "date": "2019-07-12T01:15:08.489+02:00",
          "error": false,
          "code": "500",
          "latencyMs": 511.2
        },
        {
          "date": "2019-07-13T07:21:03.747+02:00",
          "error": false,
          "code": "500",
          "latencyMs": 1061.8
        },
        {
          "date": "2019-07-13T17:18:06.078+02:00",
          "error": false,
          "code": "500",
          "latencyMs": 850.1
        }
      ],
      "totalTest": 3,
      "avgSuccess": 0.3333333333333333,
      "meanLatency": "807.70",
      "success": 0
    }
  }
}
``` 

During the transformation, there is a determination of the parameters, we give value on the parameters we will use in the testing. This is dependent to the OpenAPITestConfiguration's parameter definition strategy (see OpenAPI Extension Proposal).  
These HTTP Requests objects are also dynamic, as the process of testing progresses, it will be aggregated by **Latency** records.

### List of servers

This is the list of servers currently online and testing the API.  
A Server gather all information in order to understand the current state of a Slave, to communicate with the cloud service provider, to see its progress in the process of testing the API.
See below an example :

```json
{
  "name": "api-0-asia-northeast1-b-latency",
  "testType": "latency",
  "executionType": "masterHandled",
  "region": "asia-northeast1",
  "zone": "asia-northeast1-b",
  "location": "Tokyo, Japan",
  "status": "Test failed, please delete this configuration and create a new one.",
  "state": "testing",
  "substate": "waiting",
  "progress": 51,
  "totalProgress": 8500,
  "repetitionsRemaining": 497
}
```
 
### Test results
 
The test results are all the records measured by the Slaves, the **Uptime** results are located at the root of the API object, as in the OpenAPI Extension Proposal. The **Latency** results are located in each HTTP Request object they belong to.

### OpenAPITestConfiguration

This is directly linked to the OpenAPI Extension Proposal. The only difference if this one is that this is what directly comes from the Angular application : 

```json
"testConfig": {
  "latency": {
    "repetitions": 1000,
    "interval": {
      "iso8601format": "PT1H"
    },
    "dp-hours": "01",
    "timeoutThreshold": 10000,
    "zones": [
      "asia-east2",
      "asia-northeast2",
      "europe-west4"
    ],
    "parameterDefinitionStrategy": "provided"
  },
  "uptime": {
    "repetitions": 5000,
    "interval": {
      "iso8601format": "PT10M"
    },
    "dp-minutes": "010",
    "zones": [
      "europe-north1",
      "europe-west2",
      "us-east4"
    ],
    "timeoutThreshold": 10000
  }
}
```

This object is transformed before the export.

## Master-Slave connection protocol

The Master-Slave protocol ensure reliability in the Socket connection between those two actors, the **Master** and the **Slave**.

This is directly linked to the notion of State and Substate of a Slave. But there are two case of study for this protocol :
1. In a usual case, the Master runs, and a Slave is being created and tests an API. This case has already been seen in the _What is a Slave_ section.
2. When the Master crashes and proceeds to a reboot.
3. When a **SlaveHandled** Slave crashes and has to reboot. This part needs to be finished.

### Master crashes

During its execution, the Master keeps in memory the state of every Slaves. When the Master crashes, the Socket connection between the two is lost, resulting in a Slave trying to reconnect indefinitely while continuing its test process. When a record occur, the Slave directly sends the result to the Master, if it is disconnected, it will store the result in cache and continue its testing.

Once the Master is back up online, it reads again all the APIStatus file, restoring all Slaves with each state and add each one to a 'disconnected slaves' Map. The Socket Server is turn back on, the Slave trying to reconnect since disconnection finally connects to the Master. The Master, because the Slave is part of 'disconnected slaves', at the connection, send the 'reconnection' event to the Slave. When receiving a 'reconnection' event, the Slave searching in its cache for unsent results and send all of them sequentially. From there, everything is back normal.

Here is a figure explaining the sequential events of this case :

**_[Insert Master Crashes Protocol Figure]_**

## Relation between Master and front-end Angular app

## Code architecture

### Master folder

In overall, the tool manages a list of API’s to be tested, display these in a dashboard while testing it in background, then allow the export of these results to the User. 
The Master program is composed of :
*	The `APIStatus` folder which contains :
  * The `APIStatus.json` file which contains all current tested API’s data.
	* The functions used to access or edit these data.
* The `ExpressManagement` folder which contains  :
  * The public folder contains the Angular compiled application.
  * expressCreation is the file containing all the functions used for the Master start up.
  * `expressEndpoint.js` is the file managing the express endpoints. For example, the behavior of the ‘`/OpenAPI`’ endpoint is described in this file.
* The `GoogleCloudManagement` folder which contains :
  * The functions to interact with Google Cloud Platform API for instance creation and management.
  * The `GCPKeyFile.json` file which contains all the private keys to use the GCP API.
  * The `regionList.json` file which lists all the datacenters of GCP with the location, region and zone names.
* The `Parsers` folder which contains :
  * The OpenAPI JSON parser for parsing JSON OpenAPI Specifications file. This parser transforms all API’s operation into an HTTP Request Object, necessary for the tests which gathers method, parameters, headers information.
  * The PetStore parser, which does the same as OpenAPI JSON parser, but has hardcoded parameters value, for development purposes (as for FakeAPIParser).
* The `SocketServerManagement` folder which contains :
  * `socketServerCreation.js` which gathers the server creation and the ‘on client connection’ discrimination (WebClient and SlaveClient, explained later).
  * `socketServerSlaveManagement.js` which contains all functions managing the Slave connection events (to be explained in a specific part)
  * `socketServerWebClientManagement.js` which contains all functions managing the WebClient connection events :
    * `APIStatus` : Send the APIStatus data to the client
    * `deleteAPI` : Delete the API and all the Slaves currently testing it
    * `openApiTestConfig` : Receive a new OpenAPI Test Configuration, store it, create the Slaves and wait them to connect.

### Slave folder

The Slave program is, briefly, the program which connects to the Master, waits for test information, execute the tests, and then shuts down.  
For the first version of the OpenAPI Extension Proposal, only two non-functional properties are tested : **Latency** and **Uptime**.

Here is a description of these two type of test.

### Latency test

The Latency test, according to the OpenAPI Extension Proposal, is the calculation of the time between the sending of a request to a certain operation and the return of the response.  
The Slave will test the Latency of an API by requesting sequentially all its operations with the parameters and data decided by the Master. In fact, the Slave just get an object ready to be used by the HTTP NodeJS library.

### Uptime test

The Uptime test, according to the OpenAPI Extension Proposal, is the determination whether an API is available or not to handle requests. The Slave will test Uptime of an API by sending this request where :
* The `openapihost` is the `host` parameter in the OpenAPI Specification file
* The `openapibasepath` is the `basePath` parameter in the OpenAPI Specification file

```HTTP
OPTIONS / HTTP/1.1
Host: https://openapihost/openapibasepath
Content-Type: application/json; charset=utf-8
```

If the request gets a response before the `timeoutThreshold`, then the Slaves send a `true`value to the Master, `false` otherwise.

### Multiple test

Because of the existence of two execution type (_SlaveHandled_ and _MasterHandled_ slaves), there is a 'single' version of these two tests and a 'multiple' version one.  
The 'single' version is simply the previous described test.  
The 'multiple' version encompass the 'single' version by launching it the number of time the OpenAPITestConfiguration repetition parameter of the said test indicates it. Between each repetition, a timer is launched for a duration of the interval parameter of the test in the OpenAPITestConfiguration.

### One last thing about the testing process

A repetition is the fact of running a 'single' version of a test, but inside a test, there can be multiple records. See below the figure which show the succession of event sent from the Slaves to the Master.

**_[Insert Succession test Slave Multiple test Figure]_**

# Front-end

## Angular presentation

Angular is a TypeScript-based framework for building Web pages.

## The Dashboard interface

As shown in the '_What is Gadolinium ?_' section, the interface is divided in 4 parts : 
1. The upper-left part : API list.
2. The upper-right part : Servers list.
3. The bottom-left part : Uptime visualization.
4. The bottom-right part : Latency visualization.

### API list

**_[Insert API List figure]_**

This list shows all API's tested or being tested.
Two actions can be carried out on an API, by clicking on it, it will display the server list and the data visualization for this API, and two buttons will appear : 
1. The export button, available only if the API testing process is finished.
2. The delete button : this button will delete the API from the tool, delete all the servers running tests for this API and leave blank the data visualization parts.

### Server list

**_[Insert Server List figure]_**

The list of servers doesn't offer control. It just displays the state of each servers in the testing process.

### Uptime visualization

**_[Insert Uptime Visualization figure]_**

The *Uptime* visualization part displays, if uptime test has been ordered from the User, and if the testing process has begun, two charts to allow visualization : 
1. A donut chart, showing the overall availability of the API for the **past** tests. 

**_[Insert Donut Chart Screenshot]_**

2. A list of progress bars showing the overall availability of the API and showing the progress of these tests.

**_[Insert Progress bars Screenshot]_**

### Latency visualization

**_[Insert Latency Visualization figure]_**

The *Latency* visualization part displays, if latency test has been ordered from the User, and if the testing process has begun, tree charts to allow visualization :
1. A bar chart showing the average latency for each operation, for all zones combined.

**_[Insert Operation Time By Zones Screenshot]_**

2. A line chart showing the average latency of each operation over time, for all zones combined.

**_[Insert Time by Operation Over Time Screenshot]_**

3. A line chart showing the average latency of each zones over time, for all operations combined.

**_[Insert Time by Zone Over Time Screenshot]_**

### OpenAPI Test Configuration Modal

The OpenAPI Test Configuration Modal is a form appearing when clicking on the "Add a new API" button.
It consists of filling the information in order to test an API in accordance with the OpenAPI Extension Proposal.  
By default, all the fields are deactivated, they only activate when the sent file is approved by the Master (if the bar turns green). For this first version, the fields are, for both Latency and Uptime tests :
  * Test repetitions
  * Interval of time between repetitions

Then, the User can select which zones to test the API from, for Latency and Uptime (separately).

## Angular Services for Gadolinium

In Angular, a Service allows Components to interact with each other and exchange data. With help of Subjects, Observables and Subscriptions, if a Service modify an Observable variable, all subscribed Components will be notified and can run a specific function to handle these changes.  
For instance, the most representative Observable in the tool will be the `selectedApi`. Because all the interface depends on which API the User clicked on, it is important that every Components are aware of which API has been clicked and what data to display.
Thus, multiple services have been created in order to address these problems.

### APIStatusService

The APIStatusService, which its name is close to the APIStatus file, is the service in charge of handling all APIStatus file changes that the Master communicates.
At page loading, or when the file changes, the Master will directly send, via the `APIStatus` event the content of the APIStatus file.  
This will allow the APIList Component to display or hide the list of contained API's. It will also allow the App Component to know if it has to display ServerList, UptimeChart and LatencyChart Component.  
As well, it allows all Chart Components to know which data to load, if there is no API selected anymore, they have to unload all the data from the charts.

The APIStatusService also handle the `LatencyTestUpdate` and `UptimeTestUpdate` which contains the new content added to the APIStatus file from a Slave.  
**These event have a main goal**, which will be explained more deeply in the section of Charts, it consists of updating the list of data instead of recalculating it all.  
Considering a list of 1000 records about latency to format for chart purpose, updating by adding one new record is more efficient than reformating all 1001 records.

### OpenAPITestService

The OpenAPITestService is the service used by the OpenAPI Test Configuration modal to send, first of all, the OpenAPI Specifications file, then the OpenAPI Test Configuration.  
Assisted by the FileUploadService, which consists of sending by POST request the information, the OpenAPITestService ensure that the fields are properly filled (The OK button won't show up green if you haven't filled all the Latency and Uptime fields).  
For this first version, and the processus needs to be improved, the Service first sends the file by the POST `/OpenAPI` endpoint, then sends the OpenAPITestConfiguration information via the `openApiTestConfig` Socket event.

### TestResultsService

The TestResultsService is the Service directly in communication with the LatencyResultsService and the UptimeResultsService.  
By using the APIStatusService, it ensures, when an API is selected, if the previous selected API was different, that the LatencyResultsService and UptimeResultsService reinitialize and display the proper data, or if no API is selected, to erase these data.  
It also relays the update of one of the two test to the proper service.

The LatencyResultsService and UptimeResultsService have two functions : 
1. Initialize and format test results to address data to the charts
2. Update these data with a new test result in order to update the charts.

Because  update the data, it 

#### LatencyResultsService

Before presenting the different charts, i
The LatencyResultsService is in charge of 3 different charts, as presented earlier : 
1. The OperationTimesByZones chart
2. The TimeOperationsOverTime chart
3. The TimeZonesOverTime chart

It means that the service has to format the data by 3 different ways.

As the values are susceptible to change, we need an other variable to store all these data, because the chart library needs the data to be formatted a way that is not adequate to edit.  
From the generation at the Slave level to the displaying in the chart, the data is formatted in 3 different way :



This allows to store metadata such as how much record have been considered to calculate the mean, this way we can then recalculate a mean from an existing one with this formula :
```
newValue = (oldValue * nbOfTimeTested + newRecordValue) / ++nbOfTimeTested
```





##### OperationTimesByZones Chart

###### Initializing

This chart, as said, is a bar chart. The Y axis represents the latency time in `ms` and the X axis contains a category for each operation.  
In view of the functionning of the C3 library, it is needed to send the data ['in column'](https://c3js.org/reference.html#data-columns) and specify the ['categories'](https://c3js.org/reference.html#axis-x-categories).  
For this chart, the columns will contain, **for each zone**, an array with a head with the name of the zone and the tail containing the values of each operation mean latency.  
The categories will contain an array of all the operation names.  
Where the first category will have as value the first element of the tail of each column arrays.

An example for the Swagger's PetStore :
```json
columns : [
  ["asia-northeast2", 793.3, 2328.9, 927.5, 644.5, 1070, 705, 859.5,...],
  ["eu-west2", 543.3, 276.1, 320.4, 203.8, 493.3, ...],
  ...
]
```
```json
categories : ["addPet", "updatePet", "findPetsByStatus", "getPetById",...]
```

###### Updating

Because a new record only relates to one operation, we look for the existing value of this such operation, add the value to the mean and recalculate the mean.

##### TimeByOperationOverTime

###### Initializing

For this chart, it is a line chart. The Y avis represents the latency time in `ms` and the X the time at which the tests occurred. The data represents the evolution of latency time of each operation over time, by calculating the mean value of all zones.  
The X axis changes from the OperationTimesByZones chart, it is not categories but a timeserie.  
The columns will contain, **for each operation**, a couple of two arrays with :
* In the first, representing the timeserie for the operation, has as the head of the array, a string concatening 'date' with the id of the operation, and as the tail all the timestamps of each record, in a special format `YYYY MM DD HH mm SS`.
* In the second, representing the set of value of the test, all zones combined, for the operation.

In the tail of both, an element in the first array has a value in the second, which means, for each timestamps there is a linked value in the set of value.

Taking the PetStore example :
```json
"columns" : [
  ["dateaddPet", "2019 07 23 15 31 00", "2019 07 23 15 32 00", ...],
  ["addPet", "1226.50", "1241.05", ...],
  ["dateupdatePet", "2019 07 23 15 31 00", "2019 07 23 15 32 00",...],
  ["updatePet", "2328.9", "668.35", ...],
  ...
]
```

In order to have everything working in the chart, we need to link the couples :
```json
"xs" : {
  "addPet" : "dateaddPet",
  "updatePet" : "dateupdatePet"
  ...
}
```

###### Updating


Taking the new record, we look 'has the operation already been tested ?' :
* No, we create the two correspondent arrays, in the first, create the head by concatening 'date' with the name of the operation and push the record date at the good format, in the second, create the head with the name of the operation and push the record value.
* Yes, next question 'has the operation already been tested at the same time ?' :
  * No, we just push the first array with the new date, and the second with the record value.
  * Yes, we gather the index of the time in the first array, and we add the record value at the existing one at the same index in the second array, and recalculate the mean.

##### TimeByZonesOverTime

###### Initializing

For this chart, it is identical to TimeByOperationOverTime, except that the data represents the evolution of latency time of each zone over time, by calculating the mean value of all the operations.

Taking the PetStore example :
```json
"columns" : [
  ["dateasia-northeast2", "2019 07 23 15 31 00", "2019 07 23 15 32 00", ...],
  ["asia-northeast2", "1226.50", "1241.05", ...],
  ["dateueu-west2", "2019 07 23 15 31 00", "2019 07 23 15 32 00",...],
  ["eu-west2", "2328.9", "668.35", ...],
  ...
],
```
```json
"xs" : {
  "asia-northeast2" : "dateasia-northeast2",
  "eu-west2" : "dateeu-west2"
}
```

###### Updating

Because a new record only relates to one operation, we look for the existing value of this such operation, add the value to the mean and recalculate the mean.















Slave generated data
```json
{
  "operationId": "deleteUser",
  "..." : "...",
  "testResults": {
    "api-0-asia-northeast2-b-latency": {
      "latencyRecords": [
        {
          "date": "2019-07-23T15:32:06.205+02:00",
          "error": false,
          "code": "500",
          "latencyMs": 589.1
        }
      ],
      "totalTest": 1,
      "avgSuccess": 1,
      "meanLatency": "589.1",
      "success": 0
    }
  }
},
{
  "operationId": "getUserByName",
  "..." : "...",
  "testResults": {
    "api-0-asia-northeast2-b-latency": {
      "latencyRecords": [
        {
          "date": "2019-07-23T15:32:05.541+02:00",
          "error": false,
          "code": "500",
          "latencyMs": 917.9
        }
      ],
      "totalTest": 1,
      "avgSuccess": 1,
      "meanLatency": "917.9",
      "success": 0
    }
  }
},
```


meanOfRequestsByZones
```json
{
  "deleteUser" : {
    "2019 07 23 15 32 00" : {
      "value" : 589.1,
      "count" : 1
    }
  },
  "getUserByName" : {
    "2019 07 23 15 32 00" : {
      "value" : 917.9,
      "count" : 1
    }
  }
}
```

meanOfRequestsByOperations
```json
{
  "api-0-asia-northeast2-b-latency" : {
    "2019 07 23 15 32 00" : {
      "value" : 753.5,
      "count" : 2
    }
  }
}
```

meanOfAllRequests
```json
{
  "2019 07 23 15 32 00" : {
    "value" : 753.5,
    "count" : 2
  }
}
```

OperationTimesByZones
```json
{
  "columns" : [
    ["asia-northeast2", 589.1, 917.9],
  ],
  "categories" : ["deleteUser", "getUserByName"]
}
```

TimeOperationsOverTime
```json
{
  "columns" : [
    ["datedeleteUser", "2019 07 23 15 32 00"],
    ["deleteUser", 589.1],
    ["dategetUserByName", "2019 07 23 15 32 00"],
    ["getUserByName", 917.9]
  ],
  "xs" : {
    "deleteUser" : "datedeleteUser",
    "getUserByName" : "dategetUserByName"
  }
}
```

TimeZonesOverTime

```json
{
  "columns" : [
    ["dateapi-0-asia-northeast2-b-latency", "2019 07 23 15 32 00"],
    ["api-0-asia-northeast2-b-latency", 753.5],
  ],
  "xs" : {
    "api-0-asia-northeast2-b-latency" : "dateapi-0-asia-northeast2-b-latency"
  }
}
```



















