/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { handleAuth } from "./authMiddleware";
import { v4 as uuidv4 } from "uuid";

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		const authResult = await handleAuth(request);
		if (!authResult.isAuthenticated) {
			return new Response("Unauthorized", { status: 401 });
		}

		switch (url.pathname) {
			case "/api/upload":
				return handleUpload(request, env, authResult.userId);
			case "/api/images":
				return handleGetImages(request, authResult.userId);
			case "/api/cart":
				return handleCart(request, authResult.userId);
			default:
				return new Response("Not Found", { status: 404 });
		}
	}
};

async function handleUpload(request, env) {
	if (request.method !== 'POST') {
	  return new Response("Method not allowed", { status: 405 });
	}
  
	const contentType = request.headers.get("Content-Type");
	if (!contentType || !contentType.startsWith("image/")) {
	  return new Response("Unsupported media type", { status: 415 });
	}
  
	const image = await request.arrayBuffer();
  
	const uniqueFilename = `image_${Date.now()}.jpg`;

	const imageId = uuidv4();

	await env.IMAGES_BUCKET.put(uniqueFilename, image, {
		httpMetadata: { contentType },
	  });
 
	await env.MY_DB.prepare(
		`INSERT INTO images (id, user_id, filename, tags) VALUES (?, ?, ?, ?)`
	  )
		.bind(imageId, userId, uniqueFilename, "")
		.run();

	return new Response(JSON.stringify({ success: true, filename: uniqueFilename }), {
	  headers: { "Content-Type": "application/json" },
	});
  }

async function handleGetImages(request) {
	return new Response("Get images endpoint", { status: 200 });
}

async function handleCart(request) {
	return new Response("Cart endpoint", { status: 200 });
}
