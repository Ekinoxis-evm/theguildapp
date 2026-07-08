---
name: product
description: Product-management workflow for The Guild — plan a feature, update the roadmap, log decisions. Use when starting/finishing a feature, changing scope, or when the founder gives new requirements.
---

# Product management workflow

The tracker is files-in-repo, so it travels with every clone and every agent:

- `docs/PRODUCT.md` — requirements (source of truth)
- `docs/ROADMAP.md` — phased backlog with statuses
- `docs/DECISIONS.md` — decision log
- `docs/DATA_MODEL.md` / `docs/SECURITY.md` — technical contracts

## When the founder gives new requirements

1. Update `docs/PRODUCT.md` (add/modify the relevant section; keep the "Open questions" list honest).
2. Slot work into `docs/ROADMAP.md` — right phase, new numbered item.
3. If it changes a previous choice, add a `docs/DECISIONS.md` row.

## When starting a feature

1. Find its roadmap item, set `in-progress`.
2. Re-read the matching PRODUCT.md section + Open questions — ask the founder anything blocking **before** building.
3. Break into tasks; schema first (`db-migration` skill), then UI.

## When finishing

1. Roadmap item → `done`; tick related checklists.
2. Update DATA_MODEL.md if schema moved; DECISIONS.md if anything non-obvious was chosen.
3. Suggest the next roadmap item to the founder.
