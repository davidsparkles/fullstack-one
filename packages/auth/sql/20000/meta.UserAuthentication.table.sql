-- DDL generated by Postico 1.5.6
-- Not all database features are supported. Do not use for backup.

-- Table Definition ----------------------------------------------

CREATE TABLE IF NOT EXISTS _meta."UserAuthentication" (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "userId" uuid NOT NULL UNIQUE,
    "isActive" boolean NOT NULL DEFAULT true,
    "loginProviderSets" text[] NOT NULL DEFAULT ARRAY[]::text[],
    "modifyProviderSets" text[] NOT NULL DEFAULT ARRAY[]::text[],
    "invalidTokenTimestamps" bigint[] NOT NULL DEFAULT ARRAY[]::bigint[],
    "totalLogoutTimestamp" bigint NOT NULL DEFAULT 0,
    "createdAt" timestamp without time zone NOT NULL DEFAULT timezone('UTC'::text, now())
);

-- Indices -------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "UserAuthentication_pkey" ON _meta."UserAuthentication"(id uuid_ops);
CREATE UNIQUE INDEX IF NOT EXISTS "UserAuthentication_userId_key" ON _meta."UserAuthentication"("userId" uuid_ops);