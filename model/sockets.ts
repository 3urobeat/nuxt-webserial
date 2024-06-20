/*
 * File: sockets.ts
 * Project: nuxt-webserial
 * Created Date: 2024-06-14 10:19:07
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-20 10:43:33
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * Licensed under the MIT license: https://opensource.org/licenses/MIT
 * Permission is granted to use, copy, modify, and redistribute the work.
 * Full license information available in the project LICENSE file.
 */


import type { WebSocketServer } from "ws";


export type StoredWebSocket = { id: string, wss: WebSocketServer };
