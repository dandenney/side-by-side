// Parse a recipe from a page's embedded JSON-LD (schema.org Recipe). Shared by
// the /api/recipe-preview route (URL-first add form). The import script
// (scripts/import-recipe.mjs) uses an equivalent copy in plain JS.

export interface ParsedRecipe {
  title: string
  ingredients: string[]
  instructions: string[]
  servings?: string
  imageUrl?: string
}

function firstImageUrl(image: unknown): string | undefined {
  if (!image) return undefined
  const one = Array.isArray(image) ? image[0] : image
  if (typeof one === 'string') return one
  if (one && typeof one === 'object') {
    const obj = one as Record<string, unknown>
    return (obj.url as string) || (obj.contentUrl as string) || undefined
  }
  return undefined
}

function toLines(value: unknown): string[] {
  if (!value) return []
  const arr = Array.isArray(value) ? value : [value]
  return arr
    .map((v) => {
      if (typeof v === 'string') return v
      if (v && typeof v === 'object') {
        const obj = v as Record<string, unknown>
        return (obj.text as string) || (obj.name as string) || ''
      }
      return ''
    })
    .map((s) => s.trim())
    .filter(Boolean)
}

// recipeInstructions can be strings, HowToStep objects, or HowToSection groups.
function toInstructions(value: unknown): string[] {
  if (!value) return []
  const arr = Array.isArray(value) ? value : [value]
  const out: string[] = []
  for (const step of arr) {
    if (typeof step === 'string') {
      out.push(step.trim())
    } else if (step && typeof step === 'object') {
      const obj = step as Record<string, unknown>
      if (obj['@type'] === 'HowToSection' && Array.isArray(obj.itemListElement)) {
        out.push(...toLines(obj.itemListElement))
      } else if (obj.text || obj.name) {
        out.push(String(obj.text || obj.name).trim())
      }
    }
  }
  return out.filter(Boolean)
}

// Recipe JSON-LD may be a bare object, an array, or nested inside an @graph.
export function extractRecipeJsonLd(html: string): Record<string, unknown> | null {
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    let parsed: unknown
    try {
      parsed = JSON.parse(m[1].trim())
    } catch {
      continue
    }
    const graph = (parsed as Record<string, unknown>)?.['@graph']
    const candidates = Array.isArray(parsed)
      ? parsed
      : Array.isArray(graph)
        ? graph
        : [parsed]
    for (const c of candidates) {
      const type = (c as Record<string, unknown>)?.['@type']
      const isRecipe = Array.isArray(type) ? type.includes('Recipe') : type === 'Recipe'
      if (isRecipe) return c as Record<string, unknown>
    }
  }
  return null
}

export function parseRecipeHtml(html: string): ParsedRecipe | null {
  const r = extractRecipeJsonLd(html)
  if (!r) return null

  const rawYield = Array.isArray(r.recipeYield) ? r.recipeYield[0] : r.recipeYield
  const title = String(r.name || '').trim()
  if (!title) return null

  return {
    title,
    ingredients: toLines(r.recipeIngredient),
    instructions: toInstructions(r.recipeInstructions),
    servings:
      rawYield != null && rawYield !== '' ? String(rawYield) : undefined,
    imageUrl: firstImageUrl(r.image),
  }
}
