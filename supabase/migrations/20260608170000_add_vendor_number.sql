/*
  # Add Sales and Trends vendor number

  The Sales Reports API requires the account's vendor number (found in App Store
  Connect → Sales and Trends). It is account-level (one per user), not secret, so
  it lives alongside the ASC credentials and the browser may read it to show it
  in Settings. Writes still go through the edge function (service_role).
*/

ALTER TABLE asc_credentials ADD COLUMN IF NOT EXISTS vendor_number text DEFAULT '';

-- The vendor number is not a secret; let the client read it (e.g. to display it
-- in Settings). It still cannot be written by the client.
GRANT SELECT (vendor_number) ON asc_credentials TO authenticated;
