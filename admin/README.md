# Varanasi Connect Admin Panel

A separate static admin app for the existing Supabase project. It does not replace or modify the public website.

## Free hosting target
Deploy this folder as the root of a separate Vercel Hobby project and attach `admin.varanasiconnect.in`. No build command is required. Do not enable paid add-ons.

## Secure setup
1. Review `../supabase/migrations/20261105020000_vc_admin_access.sql`.
2. Export/backup the production database before applying the SQL.
3. Apply the migration in Supabase only after the migration and backup have been approved.
4. Add `https://admin.varanasiconnect.in/` to Supabase Auth's allowed redirect URLs.
5. Verify the existing Discord OAuth provider allows the subdomain callback.

The panel uses only the existing public publishable key. Never put a service-role key in this folder.

## Features
- Event create/edit
- Review moderation (delete)
- Registration list
- Event image URL records
- Event poster and gallery photo uploads through the existing `vc-event-posters` Storage bucket
- Event pinning, date-based ordering and configurable action buttons
