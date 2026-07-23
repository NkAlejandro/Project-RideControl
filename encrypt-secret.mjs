import sodium from "libsodium-wrappers";
const { GH_PUB_KEY, FIREBASE_REFRESH_TOKEN } = process.env;
await sodium.ready;
const key = sodium.from_base64(GH_PUB_KEY);
const encrypted = sodium.crypto_box_seal(Buffer.from(FIREBASE_REFRESH_TOKEN), key);
console.log(sodium.to_base64(encrypted));
