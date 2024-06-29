<!--
/*
 * File: index.vue
 * Project: nuxt-webserial
 * Created Date: 2024-06-12 19:37:13
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-29 21:53:37
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


    // Transmit data between client & server
    async function handleDataStreams() {

        // Pass data read from websocket on to client
        const encoder = new TextEncoder();

        ws!.onmessage = (event) => {
            console.log(`[DEBUG] WebSocket onmessage: Writing '${event.data}' to client...`)

            const encoded: Uint8Array = encoder.encode(String(event.data)); // We need to encode our string to a Uint8Array first

            clientWriter?.write(encoded);
        }


        // Listen for new data from the client and send to the server
        while (ws && clientReader) {
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

                ws.onopen = () => {
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

        ws = null;

        if (clientPort) {
            console.log("Closing clientPort...");

            clientReader?.cancel(); // Allows us to call releaseLock for reader below

            clientReader?.releaseLock(); // Release lock to be able to call close() below
            clientWriter?.releaseLock();

            await clientPort.close();
            await clientPort.forget(); // Tell browser we are not using the device anymore
        }

        clientPort = null;
        clientReader = null;
        clientWriter = null;

        isConnected.value = false;
    }


    // Attempt to connect client & server
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

        // Set client streams and start handling data
        clientReader = clientPort.readable?.getReader()!;
        clientWriter = clientPort.writable?.getWriter()!;

        handleDataStreams();


        // Success
        isConnected.value = true;
        console.log("Successfully connected!");
        console.log(clientPort);

    }


    // Disconnect when user leaves page
    onBeforeUnmount(() => disconnect());

</script>
