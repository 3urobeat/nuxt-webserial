/*
 * File: storeSockets.ts
 * Project: platformio-web-flasher
 * Created Date: 2024-06-14 09:21:01
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-14 20:12:16
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
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


export function addStoredWebSocket(id: string, wss: WebSocketServer) {

    // Check if already exists
    if (getStoredWebSocket(id)) throw("WebSocketServer with that ID already exists");

    socketsCollection.push({ id: id, wss: wss });

}
