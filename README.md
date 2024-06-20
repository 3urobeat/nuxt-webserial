# nuxt-webserial
This is a demo project featuring a full implementation of a bidirectional serial communication between a client USB device and a Linux mount point using NuxtJS.  

The client USB device is connected using WebSerial (sadly requires a Chromium Browser).  
The browser creates a Read & Write stream which transfers data through a WebSocket to and from the server side.  
On the server side a child process is spawned, which creates a virtual mount point using `socat`, reads and writes data to and from it, and passes it back to the WebSocket.

Any process on the Linux server is now able to interface/communicate with the device connected to the client machine. 

In total, this project should get you an understanding of how you can transfer serial data over the web.  
This is by no means a perfect implementation and is not safe in this state (no authentication, no encryption, no safety measures).  
It should serve you as a starting point for your own project.

**Things definitely missing:**
- Better error handling
- Proper cleanup on closed connection
- Creating a cookie with a unique ID for every user and using it to restrict access to WebSocket connections

&nbsp;

## Project Structure
### composables
Contains files loaded on the server side.  
The file `handleLinuxSerial.ts` handles spawning `serialService.mjs` and handling communication between it and the websocket.

### data/mounts
Contains mount points for the mounted serial devices.  
The file `serialService.mjs` is spawned as a child process by `handleLinuxSerial.ts` and handles creating and interfacing with virtual mount points on the Linux server.  
This is required because we cannot directly interface with mount points from the nuxt process without running into a V8 engine missing lock exception.

### model
Contains TypeScript type definitions.

### pages
Contains vue pages loaded on the client side by the browser.  
The file `index.vue` handles creating a WebSerial connection and maintaining a websocket connection with the server.  
It listenes for data from the serial device or the websocket and passes data around between the two.

### server/middleware
Contains files loaded on the server side.  
The file `serialWebsocket.ts` handles getting or creating a new WebSocketServer to allow websocket communication with the client.  
It accepts data from `handleLinuxSerial.ts` and `index.vue` and passes data around between the two.

### stores
Contains files loaded on the server side.  
The file `storeSockets.ts` contains a collection to store existing WebSocketServers to reuse them.

### /
Entry point `app.vue`.
