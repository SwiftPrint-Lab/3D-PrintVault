import crypto from "node:crypto";

const LICENSE_ALPHABET =
  "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const PRODUCT_PREFIX =
  "3DPV";

const BLOCK_LENGTH =
  5;

const BLOCK_COUNT =
  3;

export type LicensePlan =
  | "free"
  | "pro"
  | "business";

function randomCharacter(): string {
  const index =
    crypto.randomInt(
      0,
      LICENSE_ALPHABET.length,
    );

  return LICENSE_ALPHABET[
    index
  ];
}

function createRandomBlock():
  string {
  let block = "";

  for (
    let index = 0;
    index < BLOCK_LENGTH;
    index += 1
  ) {
    block +=
      randomCharacter();
  }

  return block;
}

function planPrefix(
  plan: LicensePlan,
): string {
  switch (plan) {
    case "free":
      return "FREE";

    case "pro":
      return "PRO";

    case "business":
      return "BIZ";
  }
}

export function generateLicenseKey(
  plan: LicensePlan,
): string {
  const blocks =
    Array.from(
      {
        length:
          BLOCK_COUNT,
      },
      () =>
        createRandomBlock(),
    );

  return [
    PRODUCT_PREFIX,
    planPrefix(plan),
    ...blocks,
  ].join("-");
}

export function normalizeLicenseKey(
  licenseKey: string,
): string {
  return licenseKey
    .trim()
    .toUpperCase();
}

export function hashLicenseKey(
  licenseKey: string,
): string {
  const normalized =
    normalizeLicenseKey(
      licenseKey,
    );

  const hash =
    crypto
      .createHash("sha256")
      .update(normalized)
      .digest("hex");

  return `sha256:${hash}`;
}

export function isValidLicenseKeyFormat(
  licenseKey: string,
): boolean {
  const normalized =
    normalizeLicenseKey(
      licenseKey,
    );

  return /^3DPV-(FREE|PRO|BIZ)-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/.test(
    normalized,
  );
}
