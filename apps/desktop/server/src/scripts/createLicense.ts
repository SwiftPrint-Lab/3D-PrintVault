import "dotenv/config";

import {
  pool,
} from "../db.js";

import {
  createLicense,
} from "../licenseAdmin.js";

import type {
  LicensePlan,
} from "../licenseKey.js";

const [
  planArg,
  maxActivationsArg,
] =
  process.argv.slice(2);

const plan =
  planArg as
    | LicensePlan
    | undefined;

if (
  !plan ||
  ![
    "free",
    "pro",
    "business",
  ].includes(plan)
) {
  console.error(
    "Usage: npm run license:create -- <free|pro|business> [maxActivations]",
  );

  process.exit(1);
}

const maxActivations =
  maxActivationsArg
    ? Number(
        maxActivationsArg,
      )
    : 1;

try {
  const license =
    await createLicense({
      plan,
      maxActivations,
    });

  console.log("");
  console.log(
    "License created successfully.",
  );
  console.log("");
  console.log(
    `ID: ${license.id}`,
  );
  console.log(
    `Plan: ${license.plan}`,
  );
  console.log(
    `Max activations: ${license.maxActivations}`,
  );
  console.log("");
  console.log(
    `LICENSE KEY: ${license.licenseKey}`,
  );
  console.log("");
  console.log(
    "IMPORTANT: Store or deliver this key now. The plaintext key is not stored in PostgreSQL.",
  );
} finally {
  await pool.end();
}
