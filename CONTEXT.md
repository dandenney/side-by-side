# Side by Side

A single-household web app of list-based features (upcoming events, groceries, local places, shares). This document captures the domain language for the **Recipe Tracker** feature; other features are described only where they intersect.

## Language

### Recipe Tracker

**Recipe**:
A dish the household wants to cook or has cooked, with a title, ingredients, instructions, and tags. Lives in its own `recipes` table, separate from `url_items`.

**To Try**:
The default stage of a Recipe — on the list but not yet cooked. Represented as `status = 'to_try'`.
_Avoid_: "wishlist", "backlog", "queue"

**Tried**:
A Recipe that has been cooked, moved from **To Try** via a one-way transition. Represented as `status = 'tried'`, stamped with `tried_at`. A Tried recipe carries a **Rating**.
_Avoid_: "done", "made", "cooked" (as a status name)

**Rating**:
A binary judgment on a **Tried** Recipe — thumbs up or thumbs down (`'up' | 'down'`). Absent until a Recipe is Tried. Not a 3-way scale; nuance goes in **Notes**.
_Avoid_: "score", "stars"

**Notes**:
Free-text commentary on a Recipe, editable at any stage (before or after trying). Part of the **Search** corpus.

**Ingredients**:
The list of ingredients, stored as raw lines exactly as imported (`text[]`), e.g. `["2 tbsp olive oil", "8 oz crimini mushrooms, stems removed"]`. Not parsed into quantity/unit/name. Part of the **Search** corpus.

**Instructions**:
The cooking steps. Stored for display but deliberately **excluded** from **Search**.

**Source URL**:
An optional link to where the Recipe came from — often a video worth rewatching for technique. Not present in the ReciMe export; added manually. Reference only, not searched.

**Search**:
Free-text lookup over a Recipe's `title + ingredients + notes` only, run client-side over the loaded list. Query and text are normalized by rules-based singularization (watermelon ≡ watermelons) before matching. Driving use case: "we have watermelon — which recipes use it?" Instructions, source URL, servings, and image are excluded.

**Tag**:
A label from a small, fixed, app-defined vocabulary used to filter Recipes. Starting set: `breakfast`, `lunch`, `dinner`, `sides`, `dessert`, `snack`, `drinks`, `sauces` (extendable by editing the app constant — no migration, since it's a `text[]`). Stored as a `text[]` column on `recipes`; a Recipe may carry several. Recipes import with no tags; tags are applied over time. Not the same system as the `tags`/`item_tags` tables used by `url_items`.

## Relationships

- A **Recipe** is in exactly one stage: **To Try** or **Tried**.
- The transition To Try → Tried is **one-way**; a Recipe never moves back.
- A **Rating** exists only on a **Tried** Recipe.
- **Notes** may exist on a Recipe in either stage.
- A **Recipe** carries zero or more **Tags**.
- Recipes are presented at a single `/recipes` route with a **To Try** / **Tried** segmented toggle; each Recipe has a full-page detail view at `/recipes/[id]`.

## Example dialogue

> **Dev:** "When we import the 80 recipes from ReciMe, what stage are they in?"
> **Domain expert:** "All **To Try**. ReciMe never tracked whether we cooked something, so we don't fake it — we promote and rate them as we actually make them."
> **Dev:** "And searching 'watermelon' — does that look at the instructions too?"
> **Domain expert:** "No. Just the title, the ingredients, and my notes. And it should still find it if I type 'watermelons'."

## Flagged ambiguities

- "moves to another list" (user's phrasing) was resolved to a **status change on one table**, not a physically separate table — a Tried recipe is the same Recipe, further along.
- "meta" (user's phrasing, as a searchable field alongside title and ingredients) turned out to be nearly empty in the ReciMe data — the source provides little beyond the title. Resolved: the search corpus is **title + ingredients + notes**; there is no distinct "meta" field.
