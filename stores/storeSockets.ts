/*
 * File: storeSockets.ts
 * Project: nuxt-webserial
 * Created Date: 2024-06-14 09:21:01
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-20 11:06:19
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * Licensed under the MIT license: https://opensource.org/licenses/MIT
 * Permission is granted to use, copy, modify, and redistribute the work.
 * Full license information available in the project LICENSE file.
 */


import type { WebSocketServer } from "ws";
import type { StoredWebSocket } from "~/model/sockets";


const socketsCollection: StoredWebSocket[] = [];


/**
 * Gets a stored WebSocketServer from the collection by id
 * @param id UUID of the socket
 * @returns {StoredWebSocket | undefined} Returns the stored socket, if found.
 */
export function getStoredWebSocket(id: string) { // TODO: Validate id with cookie to disallow users getting sockets from someone else

    // Attempt to find socket
    const match = socketsCollection.find((e) => e.id == id);

    return match;

}


/**
 * Adds a websocket server to the sockets collection
 * @param id ID of the socket
 * @param wss WebSocketServer instance to store
 */
export function addStoredWebSocket(id: string, wss: WebSocketServer) {

    // Check if already exists
    if (getStoredWebSocket(id)) throw("WebSocketServer with that ID already exists");

    socketsCollection.push({ id: id, wss: wss });

    console.log(`[DEBUG] addStoredWebSocket(): New WebSocketServer registered, there are now ${socketsCollection.length} socket servers stored`);

}
