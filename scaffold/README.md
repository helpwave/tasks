# Scaffold

Location-tree data loaded at backend startup from JSON files in a configurable directory.

## Environment

- **SCAFFOLD_DIRECTORY** – Path to a directory containing `*.json` files. If unset, scaffold loading is skipped.
- **SCAFFOLD_STRATEGY** – One of `CHECK`, `MERGE`, `FORCE`. Parsed from env (case-insensitive); invalid values fall back to `CHECK`.

## JSON format

Each file may be a single root object or a list of root objects. Root objects have:

- `name`, `type` (e.g. `HOSPITAL`, `CLINIC`, `WARD`, `ROOM`, `BED`, `TEAM`, `PRACTICE`, `OTHER`)
- optional `children` (array of same shape)
- optional `organization_ids` (for HOSPITAL, CLINIC, PRACTICE, TEAM)

All `*.json` files in the directory are loaded, merged into one list of root items, and imported in a single transaction.

## Strategies

### CHECK (default)

- If any location node already exists in the database, scaffold loading is **skipped**.
- No wait, no overwrite.

### MERGE

- All JSON files are loaded and merged into one payload; that payload is imported **once**.
- New location nodes are created **beside** existing ones (existing nodes are matched by `title`, `kind`, `parent_id` and reused).
- **Reinitialization wait:** If the scaffold directory content (file set and contents) has **changed** since the last run, the backend logs a **warning** and waits **120 seconds** before importing. If the content is **unchanged** (same hash in the state file), the wait is skipped.

### FORCE

- All JSON files are loaded and merged; then the backend **replaces** scaffold location data with that payload.
- **Reinitialization wait:** Same 120-second warning and hash check as MERGE; no wait when directory content is unchanged.

**Before deleting locations:**

1. **Backup clinic for existing patients**  
   If any patient has a `clinic_id`, a **“Scaffold backup clinic”** is created (root CLINIC) and linked to the organization **`global`**. All such patients are moved to this backup clinic so they are not left without a clinic.

2. **Personal location nodes are not deleted**  
   Location nodes created for **users without an attached organization** (title `"{username}'s Organization"`, root, no row in `location_organizations`) are **preserved**. Only other scaffold/organization locations are removed.

3. User root-location links (`user_root_locations`) are removed only for locations that are being deleted; links to preserved personal locations stay.
4. Patient assignments (locations, teams), task assignee team, and then `location_organizations` and the non-preserved location nodes are cleared. Preserved nodes and the backup clinic (if created) are kept.
5. The merged JSON payload is imported as in MERGE.

## Personal location nodes

When a user has **no** organization attached, the backend creates a single root location for them: title `"{username}'s Organization"`, kind CLINIC, with no `location_organizations` row. These nodes are considered **personal** and are **never** deleted by scaffold FORCE, so user access is preserved.

## Reinitialization check (MERGE / FORCE)

A hash of the scaffold directory (file names, mtimes, sizes, and contents) is computed in memory and stored in the **database** after a successful import (table `scaffold_import_state`, key `directory_hash`). No files are written to the scaffold directory. On the next run, the backend compares the current directory hash with the stored value; if they match, the 120-second reinitialization wait is skipped.
