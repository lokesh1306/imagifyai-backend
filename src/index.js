/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { handleAuth } from "../auth/authMiddleware.js";
import handleRegister from "../auth/register.js";
import handleLogin from "../auth/login.js";
import handleUpload from "../handlers/handleUpload.js";
import handleGetImages from "../handlers/handleGetImages.js";
import handleCart from "../handlers/handleCart.js";
import handleSearch from "../handlers/handleSearch.js";

function setCORSHeaders(response) {
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "https://images.lokesh.cloud");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Allow-Credentials", "true");

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
    });
}

function handleOptions(request) {
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "https://images.lokesh.cloud");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Max-Age", "86400");

    return new Response(null, { headers });
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === "OPTIONS") {
            return handleOptions(request);
        }

        let response;

        try {
            switch (url.pathname) {
                case "/api/register":
                    response = await handleRegister(request, env);
                    break;
                case "/api/login":
                    response = await handleLogin(request, env);
                    break;
                case "/api/upload":
                case "/api/images":
                case "/api/cart":
                case "/api/search":
                    const authResult = await handleAuth(request, env);
                    if (!authResult.isAuthenticated) {
                        response = new Response("Unauthorized", { status: 401 });
                    } else {
                        if (url.pathname === "/api/upload") {
                            response = await handleUpload(request, env, authResult.userId);
                        } else if (url.pathname === "/api/images") {
                            response = await handleGetImages(request, env, authResult.userId);
                        } else if (url.pathname === "/api/search") {
                            response = await handleSearch(request, env, authResult.userId);
                        } else {
                            response = await handleCart(request, env, authResult.userId);
                        }
                    }
                    break;
                default:
                    response = new Response("Not Found", { status: 404 });
            }
        } catch (error) {
            console.error("Unhandled error:", error);
            response = new Response("Internal Server Error", { status: 500 });
        }

        return setCORSHeaders(response);
    }
};
