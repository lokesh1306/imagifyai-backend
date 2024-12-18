const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function signJWT(payload, secret, expiresIn = '1h') {
    const header = { alg: "HS256", typ: "JWT" };
    const base64Header = btoa(JSON.stringify(header));

    const base64Payload = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + Math.floor(parseExpiry(expiresIn) / 1000) }));
    const unsignedToken = `${base64Header}.${base64Payload}`;

    const signature = await crypto.subtle.sign(
        "HMAC",
        await importKey(secret),
        encoder.encode(unsignedToken)
    );

    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    return `${unsignedToken}.${base64Signature}`;
}

export async function verifyJWT(token, secret) {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) {
        console.error("Invalid token structure");
        return null;
    }

    const unsignedToken = `${header}.${payload}`;
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify(
        "HMAC",
        await importKey(secret),
        signatureBytes,
        encoder.encode(unsignedToken)
    );

    if (!valid) {
        console.error("Signature verification failed");
        return null;
    }

    const decodedPayload = JSON.parse(atob(payload));
    
    if (decodedPayload.exp && Math.floor(Date.now() / 1000) > decodedPayload.exp) {
        console.error("Token has expired");
        return null;
    }

    return decodedPayload;
}

async function importKey(secret) {
    return crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

function parseExpiry(expiry) {
    const timeMap = { s: 1000, m: 60000, h: 3600000 };
    const unit = expiry.slice(-1);
    const time = parseInt(expiry.slice(0, -1));
    return time * timeMap[unit];
}
