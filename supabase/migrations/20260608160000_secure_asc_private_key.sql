/*
  # Harden App Store Connect credential storage

  The `.p8` private key is now encrypted at rest (AES-256-GCM) by the
  `asc-proxy` edge function before it is written. To guarantee the key can never
  be read or written by a browser client, we remove the blanket table
  privileges from the client roles and re-grant SELECT only on the non-secret
  columns.

  Postgres note: a table-level SELECT grant covers every column, so revoking a
  single column is not enough on its own. We revoke the table grant first, then
  grant column-level SELECT on everything except `private_key`.

  After this migration:
    - the browser (authenticated) can read every column except `private_key`,
      and cannot INSERT/UPDATE the table at all (writes go through the edge
      function, which runs as service_role);
    - only the service role can read or write the encrypted key.
  RLS still scopes each row to its owning user.
*/

-- Drop the blanket grants that the Supabase defaults give to client roles.
REVOKE SELECT, INSERT, UPDATE ON asc_credentials FROM authenticated;
REVOKE SELECT, INSERT, UPDATE ON asc_credentials FROM anon;

-- Re-grant read access to the non-secret columns only (never private_key).
GRANT SELECT (id, user_id, key_id, issuer_id, team_id, created_at, updated_at)
  ON asc_credentials TO authenticated;
