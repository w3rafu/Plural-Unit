#!/usr/bin/env node

/**
 * Generate VAPID key pair for Web Push notifications.
 *
 * Usage:
 *   node scripts/generate-vapid-keys.mjs
 *
 * Copy the output into your .env file and set the private key
 * as a secret in your Supabase Edge Function environment.
 */

import crypto from 'node:crypto';

// Generate an ECDH key pair on the P-256 curve (same as web-push VAPID).
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
	namedCurve: 'P-256'
});

// Export raw keys in the format VAPID expects.
const publicJwk = publicKey.export({ type: 'spki', format: 'der' });
const privateJwk = privateKey.export({ type: 'pkcs8', format: 'der' });

// The raw public key is the last 65 bytes of the SPKI DER encoding.
const rawPublic = publicJwk.subarray(-65);
// The raw private key is the last 32 bytes of the PKCS8 DER encoding.
const rawPrivate = privateJwk.subarray(-32);

function toBase64Url(buffer) {
	return Buffer.from(buffer)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

const publicKeyBase64Url = toBase64Url(rawPublic);
const privateKeyBase64Url = toBase64Url(rawPrivate);

console.log('# Add these to your .env file:\n');
console.log(`PUBLIC_VAPID_KEY=${publicKeyBase64Url}`);
console.log(`\n# Add these as Supabase Edge Function secrets:\n`);
console.log(`VAPID_PRIVATE_KEY=${privateKeyBase64Url}`);
console.log(`VAPID_SUBJECT=mailto:admin@plural.unit`);
console.log(`\n# The public key also needs to be set as an Edge Function secret:`);
console.log(`PUBLIC_VAPID_KEY=${publicKeyBase64Url}`);
