<!--
/*
 * File: index.vue
 * Project: nuxt-webserial
 * Created Date: 2024-06-12 19:37:13
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-29 20:37:21
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * Licensed under the MIT license: https://opensource.org/licenses/MIT
 * Permission is granted to use, copy, modify, and redistribute the work.
 * Full license information available in the project LICENSE file.
 */
-->


<template>

    <p v-if="isConnected">Connected!</p>
    <button v-if="!isConnected" @click="serialConnect()">Connect</button>
    <button v-if="isConnected" @click="disconnect()">Disconnect</button>

</template>


<script setup lang="ts">

    // Store active streams
    let clientPort  : SerialPort                  | null = null;
    let clientReader: ReadableStreamDefaultReader | null = null;
    let clientWriter: WritableStreamDefaultWriter | null = null;

    let ws          : WebSocket                   | null = null;

    const isConnected = ref(false);


    // Sends data to the server
    async function handleDataClientToServer() {
        if (!clientReader) throw("Cannot read from client because stream is not available");

        // Listen for new data from the client for the entire runtime
        while (ws && clientPort) {                                          // TODO: Stop when websocket is closed
            const { done, value } = await clientReader.read();
            if (!value) return;

            console.log(`[DEBUG] handleDataClientToServer(): Writing '${value}' to server...`)

            ws!.send(value);
        }
    }


    // Attempts to establish stream to the server and acts as a middleware
    function connectToServer(port: SerialPort) {
        return new Promise((resolve) => {

            try {
                ws = new WebSocket(`ws://${location.host}/`);

                console.log("Sent request to server to register a WebSocketServer for us...");


                // Create streams for reading and writing when the websocket becomes available
                ws.onopen = () => {

                    // Pass data read from websocket on to client
                    const encoder = new TextEncoder();

                    ws!.onmessage = (event) => {
                        console.log(`[DEBUG] WebSocket onmessage: Writing '${event.data}' to client...`)

                        const encoded: Uint8Array = encoder.encode(String(event.data));

                        clientWriter?.write(encoded);
                    }

                    console.log("Success: WebSocket Stream connected!");
                    resolve(true);
                }


                ws.onerror = (event) => {
                    resolve(false); // Error seems to be logged already by WebSocket itself
                }
            } catch (err: any) {
                console.log("WebSocket Error: " + err);
                resolve(false);
            }

        })
    }


    // Disconnects WebSerial and WebSocket connection
    async function disconnect() {
        if (ws) {
            console.log("Closing websocket...");

            ws.close();
        }

        if (clientPort) {
            console.log("Closing clientPort...");

            clientPort.close();
            clientPort.forget();
        }

        isConnected.value = false;
    }


    // Attempt to establish stream to the serial client device
    async function serialConnect() {

        // Request port from the user's browser
        clientPort = await navigator.serial.requestPort();

        // Attempt to open
        await clientPort.open({ baudRate: 9600 })
            .catch((err: Error) => {
                console.log("Failed to open port: " + err);
                disconnect();
            });

        if (!clientPort) return;

        // Attempt to pass Stream to server
        let serverConnectResult = await connectToServer(clientPort);

        if (!serverConnectResult) {
            console.log("Failed to establish WebSocket connection to the server. Closing serial connection to client...");
            disconnect();
            return;
        }

        // Set client streams
        clientReader = clientPort.readable?.getReader()!;
        clientWriter = clientPort.writable?.getWriter()!;

        // Start reading from client
        handleDataClientToServer();

        // Success
        isConnected.value = true;
        console.log("Successfully connected!");
        console.log(clientPort);

    }


    // TODO: Close ws on unmount

</script>
