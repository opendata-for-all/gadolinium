
# Overall presentation

Gadolinium is a tool which allows testing non-functional properties of an OpenAPI described API. Test results are displayed in charts and exported in the OpenAPI Specifications file extended by non-functional properties OpenAPI Extension.  

This animated GIF shows you an example of use:

![](https://github.com/opendata-for-all/gadolinium/blob/master/documentation/GadoliniumGIFDemo.gif)

The tool uses a distributed architecture to test APIs. Due to the relevance of testing APIs from different locations of the world, the tool uses a Master-Slave architecture, in which the Master controls and manages the Slaves which are testing the API.  

Thus, the tool relies on an external hosting Cloud provider (such as Google Cloud Platform, Azure or Amazon Web Services) which is capable of quickly providing instance servers in order to run the tool.  

There are two different parts in this tool, the back-end with all the Slaves and testing management, and the front-end, which displays a dashboard.

![](https://github.com/opendata-for-all/gadolinium/blob/master/documentation/Figure-1-GadoArchitecture.png)

**For more information and how-to, visit the [wiki](https://github.com/opendata-for-all/gadolinium/wiki)!**

# The different actors in Gadolinium's interaction

By the nature of this tool, multiple actors communicate with each other in the process of testing API's, there are :
- The User, which uses the tool in order to test an API.
- The Master, which is the server directly communicating with the User and creating the Slaves.
- The Slaves, which are the servers testing the API and sending the results to the Master.
- The API, which is tested by the tool and defined by an OpenAPI Specification file.
- A service provider, which hosts and runs the Master and the Slaves.

# The Master-Slave architecture

## Motivations

When we talk about non-functional properties, such as latency and uptime, it often relies on the geographical location. When we perform a simple ICMP ping to a server, this request *physically* travels through cables to reach its destination. So, the latency of a request to a server located in Paris will be a lot shorter from Lille than Hong Kong.  
Thus, our testing tool must be *physically* running on different location around the world. That's why there is a need of a **Cloud service provider**.

## How does it work

The Master is directly in contact with the User through the front-end interface but not with the tested API's. It controls the Slaves in there manner of testing the API's.  
The Slaves are individual dynamic instance running a special program so as to test the API, so it is these which directly interact with the API's.

![](https://github.com/opendata-for-all/gadolinium/blob/master/documentation/Figure-2-Master-SlaveArchitecture.png)

# The visible part : the dashboard

API testing means measurement, measurement means charts and data visualization.

![](https://github.com/opendata-for-all/gadolinium/blob/master/documentation/Figure-3-DashboardScreenshot.png)
