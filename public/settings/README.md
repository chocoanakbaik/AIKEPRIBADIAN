# Choco AI Settings Modules

This folder separates the code for three distinct areas:

- `settings.js`: application settings.
- `personalization.js`: preferences that affect how Choco AI responds.
- `profile.js`: the signed-in user's profile.
- `settings.css`: shared styling for these panels.

## Current status

These files are scaffolds only. They are not yet imported by `public/index.html` and do not save data yet. Before implementation, inspect the existing frontend handlers, Supabase tables, and Row Level Security policies to avoid duplicate logic and ensure every record is scoped to the authenticated user's `user_id`.

## Storage rule

Supabase is the source of truth for all three areas. Do not use `localStorage` as the persistent source for these features. A failed save must be reported to the user rather than shown as successful.
