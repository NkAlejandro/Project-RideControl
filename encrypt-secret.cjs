const sodium = require("libsodium-wrappers");
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("secret-temp.json", "utf8"));
(async () => {
  await sodium.ready;
  const key = sodium.from_base64(data.pubKey);
  const encrypted = sodium.crypto_box_seal(Buffer.from(data.token, "utf8"), key);
  fs.writeFileSync("encrypted-result.txt", sodium.to_base64(encrypted), "utf8");
  console.log("DONE");
})();
