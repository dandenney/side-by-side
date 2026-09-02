# Side by Side

A single-household web app of list-based features (upcoming events, groceries, local places, shares). This document captures the domain language for the **Recipe Tracker** and **Golf** features; other features are described only where they intersect.

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

### Golf

**Course**:
One playable eighteen the household has an interest in, tracked once no matter how many times it's played. Unlike a **Local** place, a Course is not scope-limited to nearby; a destination course across the country belongs here.

A Course is usually captured from a Google Place, but its identity is its own: Bandon Dunes Resort is a single Google Place containing six Courses, so `place_id` is **nullable** and several Courses may share one. A Course whose name you typed by hand is as real as one Google returned.
_Avoid_: "club" or "resort" (either may contain several Courses), "track" (golfer slang, ambiguous in code)

**Google Place**:
The Google Places record a Course is usually captured from — the source of name, address, lat/lng, photo, website, and phone. Canonical for *identity* when present, but never required, and one Google Place may back several Courses.

**Access Type**:
How you get on: `public`, `municipal`, `semi_private`, `private`, or `resort`. The most decision-relevant field on the wishlist — it separates "we could play this Saturday" from "we never will."

Chosen by hand at add time from a fixed, app-defined vocabulary (an app constant, like recipe **Tags**), because no practical API supplies it: Google Places has no such field, GolfCourseAPI has none either, and the one database that does is enterprise-gated and club-granular. Hand entry costs seconds and gives 100% coverage.
_Avoid_: "membership" (that's the club's concern, not how you get a tee time)

**Cost Band**:
A coarse price bucket for a round — `$`, `$$`, `$$$`, `$$$$` — hand-entered and optional. Deliberately not an exact greens fee: buckets stay true for years, while a number goes stale and gets checked on the course's own site before booking anyway.
_Avoid_: "green fee", "price" (both imply a precise, current number)

**Round**:
One visit to a **Course** on a date, carrying **Notes**, a **Score**, the number of holes played, and its own **Rating**. A Course has zero or more Rounds. A Round belongs to the **household**, not to a person — a solo round and a round the two of them play together are recorded identically, with no player attribution. This matches every other table in the app (no `user_id` anywhere; RLS is `using (true)`).
_Avoid_: "play", "visit", "session"

**Score**:
Strokes taken on a **Round**, stored alongside how many holes were played (9 or 18) so a 41 is never mistaken for an 82. Read against the **Course**'s `par` to display a differential (`+10`) rather than a bare number.

**Rating** (golf):
Thumbs up or down on a **Round** — not on the Course. The same Course can earn both: Torrey Pines in a February downpour is a thumbs down, Torrey Pines on a June morning is a thumbs up. A Course's standing verdict is **Want to Play**, not an average of its Ratings.
_Avoid_: putting a rating on the Course; "course rating" (that means slope/rating to a golfer, which this app does not track)

**Played**:
A derived fact, not a stored stage: a Course is Played when it has at least one **Round**. There is no `status` column — this is a deliberate departure from the Recipe **To Try**/**Tried** enum.
_Avoid_: treating this as a status value

**Want to Play**:
An independent, user-controlled flag on a **Course**, orthogonal to **Played**. A Course can be both Played and Want to Play — the course you loved and want to return to. A Course can be Played and not Want to Play — the muni you've played and are done with.
_Avoid_: deriving this from the absence of Rounds; "to play" (reads like a stage)

## Relationships

- A **Recipe** is in exactly one stage: **To Try** or **Tried**.
- The transition To Try → Tried is **one-way**; a Recipe never moves back.
- A **Rating** exists only on a **Tried** Recipe.
- **Notes** may exist on a Recipe in either stage.
- A **Recipe** carries zero or more **Tags**.
- Recipes are presented at a single `/recipes` route with a **To Try** / **Tried** segmented toggle; each Recipe has a full-page detail view at `/recipes/[id]`.
- A **Course** has zero or more **Rounds**; a Round belongs to exactly one Course.
- **Played** and **Want to Play** are independent: all four combinations are valid and meaningful.
- A **Round** has no player; it belongs to the household.
- A **Rating** lives on a **Round**, never on a **Course** — unlike a Recipe, where the Rating is on the Recipe itself.
- A **Course** carries `holes` and `par`; a **Round** carries `holes_played` and `score`. The differential is computed, never stored.
- A **Course** is not a **Local** place. Local is scope-limited to nearby and lives in `url_items`; Courses are destinations anywhere and (like Recipes) get their own table.
- A **Google Place** backs zero or more **Courses**. A Course has at most one Google Place, and may have none.
- Google Places is the **only** external source for Golf. Every golf-specific field is entered by hand.
- Courses are presented at a single `/golf` route with a **Want to Play** / **Played** / **Map** segmented control. Unlike the Recipe toggle, these segments **do not partition** — a Course that is both appears under both, which is truthful rather than a bug.

## Example dialogue

> **Dev:** "Bandon's on the wishlist, but you've played it. Which tab do I find it in?"
> **Domain expert:** "Both. That's the whole point — I've played it and I'd give anything to go back. If I have to pick one I've lost something."
> **Dev:** "So do we rate the course or the round?"
> **Domain expert:** "The round. Torrey in the rain was miserable and Torrey in June was perfect, and both of those are true about the same course. Whether I want to go back is the **Want to Play** flag, not an average."
> **Dev:** "And should we pull par and yardage from a golf API?"
> **Domain expert:** "No. I want to know how I get on and roughly what it costs — that's it. I'll type it in."

> **Dev:** "When we import the 80 recipes from ReciMe, what stage are they in?"
> **Domain expert:** "All **To Try**. ReciMe never tracked whether we cooked something, so we don't fake it — we promote and rate them as we actually make them."
> **Dev:** "And searching 'watermelon' — does that look at the instructions too?"
> **Domain expert:** "No. Just the title, the ingredients, and my notes. And it should still find it if I type 'watermelons'."

## Flagged ambiguities

- "moves to another list" (user's phrasing) was resolved to a **status change on one table**, not a physically separate table — a Tried recipe is the same Recipe, further along.
- "meta" (user's phrasing, as a searchable field alongside title and ingredients) turned out to be nearly empty in the ReciMe data — the source provides little beyond the title. Resolved: the search corpus is **title + ingredients + notes**; there is no distinct "meta" field.
- "golf courses we'd like to play" (user's framing of the whole section) implied a pure wishlist. It isn't: the section also holds **Rounds** and courses you're done with. Resolved — **Want to Play** is a flag *within* the section, not the section's definition. The section is called **Golf**, not "Courses We'd Like to Play."
- "a course" is ambiguous between one playable eighteen and the club/resort containing several. Resolved to **one playable eighteen**, which is why `place_id` is nullable and Courses may be hand-created (Bandon Dunes Resort = one Google Place, six Courses).
- "status" was assumed to mirror the Recipe enum. Resolved: Golf has **no status column** — **Played** is derived from Round count, and **Want to Play** is an independent flag.
- Whether a **Round** belongs to a person was raised because golf is playable solo. Resolved to **household-scoped**, preserving the app's invariant that no table has a `user_id`. Consequence: "courses she hasn't played" is unanswerable, accepted knowingly.
