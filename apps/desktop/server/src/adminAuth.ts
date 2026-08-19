import crypto from "node:crypto";

import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

const ADMIN_API_KEY_HEADER =
  "x-admin-api-key";

function secureEqual(
  provided: string,
  expected: string,
): boolean {
  const providedBuffer =
    Buffer.from(
      provided,
      "utf8",
    );

  const expectedBuffer =
    Buffer.from(
      expected,
      "utf8",
    );

  if (
    providedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    providedBuffer,
    expectedBuffer,
  );
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const expectedApiKey =
    process.env.ADMIN_API_KEY
      ?.trim();

  if (!expectedApiKey) {
    request.log.error(
      "ADMIN_API_KEY is not configured.",
    );

    return reply
      .code(503)
      .send({
        success: false,
        message:
          "Administrative access is not configured.",
      });
  }

  const headerValue =
    request.headers[
    ADMIN_API_KEY_HEADER
    ];

  const providedApiKey =
    Array.isArray(
      headerValue,
    )
      ? headerValue[0]
      : headerValue;

  if (
    !providedApiKey ||
    !secureEqual(
      providedApiKey,
      expectedApiKey,
    )
  ) {
    return reply
      .code(401)
      .send({
        success: false,
        message:
          "Unauthorized.",
      });
  }
}
