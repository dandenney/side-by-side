# Golf uses Google Places only; golf-specific fields are hand-entered

The Golf section captures Courses from Google Places — the same integration already serving **Local** (`src/lib/google/places.ts`, `/api/places`). It uses **no golf-course API**. Access Type and Cost Band are chosen by hand from fixed, app-defined vocabularies.

**Why no golf API:** The household only wants two tiers of data on a Course — identity/place (name, address, photo, website, phone, map pin) and access/economics (how you get on, roughly what it costs). It explicitly does not want course profile data (par, yardage, tee boxes, course/slope rating) or provenance (architect, rankings). Google already supplies the entire first tier at zero marginal cost.

That leaves Access Type as the only field motivating a second integration, and the market does not serve it:

- **GolfCourseAPI** (free tier 50 req/day; $9.99/mo Pro) returns course name, location, tee boxes, course rating, and slope rating — and **no membership or access classification**. It is built for GPS and scorecard apps. Buying it would mean paying monthly for precisely the tier that was ruled out, while still hand-entering Access Type.
- **Golf Course Database** does carry `club_membership` (Public/Private/Municipal/Military) — the only researched source that does. But credentials require purchasing a database plus an updates subscription (contact-sales, no published price), and its unit of record is `club_id`/`club_name` — a club, not a course. It would reintroduce the multi-course-resort granularity problem on the enrichment side.
- Green-fee aggregators (Apify, Golf Intelligence, GreenFeeTracker) are commercial and track volatile data. An unrefreshed fee is worse than no fee.

Hand entry costs a few seconds per Course, gives 100% coverage, and never goes stale — decisive for a two-person list that will hold tens, not thousands, of Courses. Cost is stored as a coarse band (`$`–`$$$$`) rather than an exact fee for the same staleness reason.

**Why `place_id` is nullable:** A Course is one playable eighteen, but a Google Place is often the club or resort containing several — Bandon Dunes Resort is one Google pin over six Courses. Making Google canonical *and* required would force either six-into-one collapse or a third `Club` entity. Instead, Courses may be created by hand and may share (or omit) a `place_id`, so the domain keeps a Course meaning one consistent thing while the common path stays "search Google, tap a result."

**Considered and rejected:** (1) Extend `url_items` and treat courses as tagged **Local** items — rejected because Local is scope-limited to nearby, Courses carry golf-specific fields, and Courses have a Round history Local items have no concept of. (2) Make a golf API canonical for Course identity with Google as enrichment — rejected because it inverts the app's existing, working capture flow for data the household doesn't want. (3) Auto-match Google places to golf-API records by name — rejected because the two sources share no key and golf naming is hostile to fuzzy matching ("Pebble Beach Golf Links" vs. club "Pebble Beach Resorts").

**Consequence:** Access Type and Cost Band are only as accurate as the person entering them, and there is no backfill path if the vocabulary changes meaning. Both are app constants, so extending either vocabulary is a code edit with no migration (they are plain `text` columns, per ADR 0001's precedent). If a golf API with real access classification and course-level granularity later appears, it can be added as a nullable enrichment slot without disturbing Course identity.
