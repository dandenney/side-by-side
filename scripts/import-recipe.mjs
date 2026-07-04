// Import a single recipe from a ReciMe share URL into the `recipes` table.
//
// Usage:
//   node --env-file=.env.local scripts/import-recipe.mjs <recime-url> [--dry-run]
//   npm run import-recipe -- <recime-url>            (see package.json)
//
// It parses the JSON-LD (@type: Recipe) embedded in the share page, re-hosts the
// image into the recipe-images bucket, and inserts one recipe in the `to_try`
// stage. Idempotent: skips if a recipe with the same source_url already exists.
//
// Exit codes (agent-friendly):
//   0  inserted, or skipped-as-duplicate, or dry-run
//   1  usage / missing env / no Recipe JSON-LD / DB error

import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const url = args.find((a) => !a.startsWith('--'))

if (!url) {
  console.error('Usage: node --env-file=.env.local scripts/import-recipe.mjs <recime-url> [--dry-run]')
  process.exit(1)
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
// Needs a service-role / secret key to bypass RLS. Prefer the new-style secret
// key; fall back to the legacy service_role var.
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

// A publishable/anon key can't insert (RLS requires elevated privileges); fail
// fast with a clear message rather than a cryptic RLS rejection at write time.
function assertPrivilegedKey(key) {
  const isPublishable = key.startsWith('sb_publishable_')
  let jwtRole
  const parts = key.split('.')
  if (parts.length === 3) {
    try {
      jwtRole = JSON.parse(Buffer.from(parts[1], 'base64').toString()).role
    } catch {
      /* ignore */
    }
  }
  if (isPublishable || jwtRole === 'anon') {
    console.error(
      'The configured key is a publishable/anon key, which cannot write (RLS).\n' +
        'Add your Supabase SECRET key to .env.local as SUPABASE_SECRET_KEY\n' +
        '(Dashboard → Project Settings → API Keys → secret key, sb_secret_…).'
    )
    process.exit(1)
  }
}

function firstImageUrl(image) {
  if (!image) return null
  const one = Array.isArray(image) ? image[0] : image
  if (typeof one === 'string') return one
  if (one && typeof one === 'object') return one.url || one.contentUrl || null
  return null
}

// Recipe JSON-LD may live as a bare object, an array, or inside an @graph.
function extractRecipe(html) {
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  let m
  while ((m = re.exec(html))) {
    let parsed
    try {
      parsed = JSON.parse(m[1].trim())
    } catch {
      continue
    }
    const candidates = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed['@graph'])
        ? parsed['@graph']
        : [parsed]
    for (const c of candidates) {
      const type = c && c['@type']
      const isRecipe = Array.isArray(type) ? type.includes('Recipe') : type === 'Recipe'
      if (isRecipe) return c
    }
  }
  return null
}

function toLines(value) {
  if (!value) return []
  return (Array.isArray(value) ? value : [value])
    .map((v) => (typeof v === 'string' ? v : v && (v.text || v.name)) || '')
    .map((s) => s.trim())
    .filter(Boolean)
}

// recipeInstructions can be strings, HowToStep objects, or HowToSection groups.
function toInstructions(value) {
  if (!value) return []
  const arr = Array.isArray(value) ? value : [value]
  const out = []
  for (const step of arr) {
    if (typeof step === 'string') {
      out.push(step.trim())
    } else if (step && step['@type'] === 'HowToSection' && Array.isArray(step.itemListElement)) {
      out.push(...toLines(step.itemListElement))
    } else if (step && (step.text || step.name)) {
      out.push(String(step.text || step.name).trim())
    }
  }
  return out.filter(Boolean)
}

async function rehostImage(supabase, imageUrl) {
  if (!imageUrl) return null
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`image fetch ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length === 0) throw new Error('empty image')

    const ext = (imageUrl.split('.').pop() || 'jpg').split('?')[0].slice(0, 5)
    const fileName = `recipe-image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, buffer, {
        contentType: res.headers.get('content-type') || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      })
    if (error) throw error

    return supabase.storage.from('recipe-images').getPublicUrl(fileName).data.publicUrl
  } catch (err) {
    console.warn(`  ⚠ image not re-hosted: ${err.message}`)
    return null
  }
}

async function main() {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) {
    console.error(`Failed to fetch ${url}: ${res.status}`)
    process.exit(1)
  }
  const html = await res.text()

  const recipe = extractRecipe(html)
  if (!recipe) {
    console.error(`No Recipe JSON-LD found at ${url}`)
    process.exit(1)
  }

  const yieldVal = Array.isArray(recipe.recipeYield) ? recipe.recipeYield[0] : recipe.recipeYield
  const mapped = {
    title: (recipe.name || '').trim(),
    ingredients: toLines(recipe.recipeIngredient),
    instructions: toInstructions(recipe.recipeInstructions),
    servings: yieldVal != null && yieldVal !== '' ? String(yieldVal) : null,
    source_url: url,
    imageSrc: firstImageUrl(recipe.image),
  }

  if (!mapped.title) {
    console.error(`Recipe has no title at ${url}`)
    process.exit(1)
  }

  if (dryRun) {
    console.log('DRY RUN — parsed recipe (nothing written):')
    console.log(JSON.stringify({ ...mapped, tags: [], status: 'to_try' }, null, 2))
    process.exit(0)
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL / SUPABASE_SECRET_KEY (run with --env-file=.env.local)')
    process.exit(1)
  }
  assertPrivilegedKey(SERVICE_KEY)
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  // Idempotency: skip if this source_url was already imported.
  const { data: existing, error: dupErr } = await supabase
    .from('recipes')
    .select('id')
    .eq('source_url', url)
    .maybeSingle()
  if (dupErr) {
    console.error(`Dedup check failed: ${dupErr.message}`)
    process.exit(1)
  }
  if (existing) {
    console.log(`SKIP (already imported): ${existing.id} — ${mapped.title}`)
    process.exit(0)
  }

  const imageUrl = await rehostImage(supabase, mapped.imageSrc)

  const { data, error } = await supabase
    .from('recipes')
    .insert([
      {
        title: mapped.title,
        ingredients: mapped.ingredients,
        instructions: mapped.instructions,
        servings: mapped.servings,
        source_url: mapped.source_url,
        image_url: imageUrl,
        tags: [],
      },
    ])
    .select('id')
    .single()

  if (error) {
    console.error(`Insert failed: ${error.message}`)
    process.exit(1)
  }

  console.log(
    `OK ${data.id} — ${mapped.title}` +
      ` (${mapped.ingredients.length} ingredients, ${mapped.instructions.length} steps` +
      `${imageUrl ? '' : ', no image'})`
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
