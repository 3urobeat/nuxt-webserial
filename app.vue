<!--
/*
 * File: app.vue
 * Project: platformio-web-flasher
 * Created Date: 2024-06-12 19:37:13
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-12 22:38:34
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
-->


<template>
    <!-- Title bar -->
    <PhList class="fixed z-30 cursor-pointer left-3 top-2 dark:text-text-dark lg:hidden block transition-opacity" size="25px" @click="showNavbar = !showNavbar"></PhList>

    <header
        id="titlebar"
        class="fixed z-20 top-0 left-0 w-screen h-fit mb-5 pb-1.5 bg-bg-light dark:text-text-dark border-y-2 border-y-border-primary-light dark:border-y-border-primary-dark border-t-0 transition-all duration-500"
    >
        <!-- Title -->
        <div class="pt-2 w-full text-center select-none flex items-center justify-center font-semibold transition-opacity duration-500">
            PlatformIO Web Flasher
        </div>

    </header>


    <!-- The main content itself -->
    <main class="fixed z-10 w-screen h-screen bg-bg-light dark:bg-bg-dark dark:text-text-dark transition-all duration-500 lg:pl-52 overflow-auto">
        <NuxtPage></NuxtPage> <!-- Links to index.vue -->
    </main>

</template>


<script setup lang="ts">
    import packagejson from "./package.json";

    // Specify page information
    useSeoMeta({
        title: "PlatformIO Web Flasher",
        ogTitle: "PlatformIO Web Flasher",
        description: "",
        ogDescription: ""
    });

    /* useHead({
        link: [{ rel: "icon", type: "image/png", href: "favicon.png" }]
    }); */

</script>
