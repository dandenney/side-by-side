# Recipes get a standalone table and array tags, not the `url_items`/`item_tags` reuse

The app's other lists (shares, local) share a generic `url_items` table plus a normalized `tags` + `item_tags` tag system scoped by `list_type`. Recipes deliberately do **not** reuse either. They live in a dedicated `recipes` table, and their tags are a `text[]` column, not the join-table system.

**Why a standalone table:** Recipes carry structure the generic list doesn't — `ingredients text[]`, `instructions text[]`, a two-stage `status` (`to_try` → `tried`, one-way), a binary `rating`, and `tried_at`. Bending `url_items` to fit would add many columns that are null for every other list (and vice versa). The lifecycle and search corpus (title + ingredients + notes, excluding instructions) are recipe-specific.

**Why `text[]` tags instead of `tags`/`item_tags`:** The existing `item_tags` join is wired to `url_items` by foreign key and its tag vocabulary is scoped to `list_type` values `'local' | 'shared'` — neither fits recipes. More importantly, recipe tags are a small, fixed, app-defined vocabulary (breakfast, lunch, dinner, sides, dessert, snack, drinks, sauces), not an open user-generated set. An array column with a GIN index gives multi-tag filtering with zero join plumbing, and the vocabulary is extended by editing an app constant — no migration.

**Considered and rejected:** (1) Extend `url_items` with recipe columns — rejected for the null-column bloat above. (2) Add a `'recipe'` value to the `tags`/`item_tags` system — rejected because `item_tags` FKs `url_items`, so recipes can't participate without further schema surgery, and a normalized tag store is overkill for a fixed 8-item vocabulary.

**Consequence:** Recipe tags don't share the rename-everywhere / DB-enforced-canon properties of the normalized system. Acceptable because the vocabulary is fixed and controlled in code. If recipe search ever outgrows client-side filtering, the schema (`title text`, `ingredients text[]`, `notes text`) already supports dropping in a Postgres `tsvector` search column without data changes.
