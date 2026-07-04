import { Recipe, RecipeStatus } from '@/types/recipe'

// Client-side recipe search & filtering (see CONTEXT.md "Search").
//
// Search covers title + ingredients + notes only — never instructions. Query
// and text are normalized by rules-based singularization so "watermelons"
// matches "watermelon" and vice versa. Typo tolerance is intentionally not
// handled here (deferred until needed).

// Reduce a lowercase word to a naive singular stem. Deliberately conservative:
// it only collapses common English plural endings, so it won't conflate
// unrelated food words (unlike edit-distance fuzzy matching).
export function singularize(word: string): string {
  if (word.length <= 3) return word
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y` // berries -> berry
  if (/(oes|ses|xes|zes|ches|shes)$/.test(word)) return word.slice(0, -2) // tomatoes -> tomato, dishes -> dish
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1) // watermelons -> watermelon (but glass -> glass)
  return word
}

// Split arbitrary text into lowercase, singularized tokens.
export function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(singularize)
}

// The searchable text for a recipe: title + ingredients + notes (NOT instructions).
function recipeSearchText(recipe: Recipe): string {
  return [recipe.title, ...recipe.ingredients, recipe.notes ?? '']
    .filter(Boolean)
    .join(' ')
}

// True if every token in the query appears (as a substring of some token) in
// the recipe's normalized searchable text. Multi-word queries are AND-ed.
export function matchesQuery(recipe: Recipe, query: string): boolean {
  const queryTokens = normalizeTokens(query)
  if (queryTokens.length === 0) return true

  const haystack = ` ${normalizeTokens(recipeSearchText(recipe)).join(' ')} `
  return queryTokens.every((token) => haystack.includes(token))
}

export interface RecipeFilter {
  query?: string
  status?: RecipeStatus
  tags?: string[] // matches recipes carrying ANY of these tags (mirrors SQL `tags && ...`)
}

export function filterRecipes(
  recipes: Recipe[],
  filter: RecipeFilter = {}
): Recipe[] {
  const { query, status, tags } = filter

  return recipes.filter((recipe) => {
    if (status && recipe.status !== status) return false
    if (tags && tags.length > 0 && !tags.some((t) => recipe.tags.includes(t)))
      return false
    if (query && query.trim() && !matchesQuery(recipe, query)) return false
    return true
  })
}
