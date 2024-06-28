<!--
/*
 * File: index.vue
 * Project: nuxt-webserial
 * Created Date: 2024-06-12 19:37:13
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-28 19:49:51
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
    let serverReader: ReadableStreamDefaultReader | null = null;
    let serverWriter: WritableStreamDefaultWriter | null = null;

    const isConnected = ref(false);


    // Reads data from the server and writes it to the client
    async function handleDataServerToClient() {
        if (!serverReader) throw("Cannot read from server because stream is not available");
        if (!clientWriter) throw("Cannot write to client because stream is not available");

        const encoder = new TextEncoder();

        // Listen for new data from the server for the entire runtime
        while (ws && clientPort) {                                          // TODO: Stop when websocket is closed
            const { done, value } = await serverReader.read();
            if (!value) return;

            console.log(`[DEBUG] handleDataServerToClient(): Writing '${value}' to client...`)

            // Encode data to UInt8Array for the WritableStreamDefaultWriter
            const encoded: Uint8Array = encoder.encode(String(value));

            clientWriter?.write(encoded)
                .catch((err) => {
                    console.log("Chunk error:", err);
                });
        }
    }


    // Sends data to the server
    async function handleDataClientToServer() {
        if (!serverWriter) throw("Cannot write to server because stream is not available");
        if (!clientReader) throw("Cannot read from client because stream is not available");

        // Listen for new data from the client for the entire runtime
        while (ws && clientPort) {                                          // TODO: Stop when websocket is closed
            const { done, value } = await clientReader.read();
            if (!value) return;

            console.log(`[DEBUG] handleDataClientToServer(): Writing '${value}' to server...`)

            serverWriter.write(value);
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
                    console.log("WebSocket connection established!");

                    const readableStream = new ReadableStream({
                        start: (controller) => {
                            ws!.onmessage = (event) => {
                                controller.enqueue(event.data);
                            }

                            ws!.onclose = () => {
                                controller.close();
                            }

                            ws!.onerror = (err) => {
                                controller.error(err);
                            }
                        }
                    });

                    const writableStream = new WritableStream({
                        write: (chunk) => {
                            ws!.send(chunk);
                        },
                        close: () => {
                            console.log('Writable stream closed');
                        },
                        abort: (err) => {
                            console.error('Writable stream error:', err);
                        }
                    });

                    // Assign readers
                    serverReader = readableStream.getReader();
                    serverWriter = writableStream.getWriter();

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
            ws = null;
        }

        if (clientPort) {
            console.log("Closing clientPort...");

            clientPort.close();
            clientPort.forget();
            clientPort = null;
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

        // Start reading from server
        handleDataClientToServer();
        handleDataServerToClient();

        // Success
        isConnected.value = true;
        console.log("Successfully connected!");
        console.log(clientPort);

    }


    // TODO: Close ws on unmount

</script>
