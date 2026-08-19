import crypto from "node:crypto";

export function createActivationToken(): string {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

export function hashActivationToken(
  token: string,
): string {
  const hash =
    crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

  return `sha256:${hash}`;
}
