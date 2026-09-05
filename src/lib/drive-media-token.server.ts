import { createHmac, timingSafeEqual } from "node:crypto";

function mediaSecret() {
  const secret = process.env["DRIVE_MEDIA_SIGNING_SECRET"];
  if (!secret || secret.length < 32)
    throw new Error("Configure DRIVE_MEDIA_SIGNING_SECRET com pelo menos 32 caracteres.");
  return secret;
}

export function createDriveMediaToken(guideId: number, lifetimeSeconds = 10 * 60) {
  const payload = `${guideId}:${Math.floor(Date.now() / 1000) + lifetimeSeconds}`;
  const signature = createHmac("sha256", mediaSecret()).update(payload).digest("base64url");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyDriveMediaToken(token: string, guideId: number) {
  try {
    if (!/^[a-zA-Z0-9_-]+$/.test(token)) return false;
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    if (Buffer.from(decoded).toString("base64url") !== token) return false;
    const [id, expires, signature] = decoded.split(":");
    if (Number(id) !== guideId || Number(expires) < Math.floor(Date.now() / 1000) || !signature)
      return false;
    const payload = `${id}:${expires}`;
    const expected = createHmac("sha256", mediaSecret()).update(payload).digest("base64url");
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}
