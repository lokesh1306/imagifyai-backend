const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function signJWT(payload, secret, expiresIn = '1h') {
    const header = { alg: "HS256", typ: "JWT" };
    const base64Header = btoa(JSON.stringify(header));
    const base64Payload = btoa(JSON.stringify({ ...payload, exp: Date.now() + parseExpiry(expiresIn) }));
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
    if (decodedPayload.exp && Date.now() > decodedPayload.exp) {
        console.error("Token has expired");
        return null;
    }

    return decodedPayload;
}
