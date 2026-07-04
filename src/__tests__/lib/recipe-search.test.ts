import {
  singularize,
  normalizeTokens,
  matchesQuery,
  filterRecipes,
} from '@/lib/recipe-search'
import { Recipe } from '@/types/recipe'

// Minimal recipe factory — only the fields search/filter care about.
function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    title: 'Untitled',
    ingredients: [],
    instructions: [],
    tags: [],
    status: 'to_try',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('singularize', () => {
  it('strips a trailing plural s', () => {
    expect(singularize('watermelons')).toBe('watermelon')
    expect(singularize('eggs')).toBe('egg')
    expect(singularize('peas')).toBe('pea')
  })

  it('handles -ies -> -y', () => {
    expect(singularize('berries')).toBe('berry')
    expect(singularize('cherries')).toBe('cherry')
  })

  it('handles -oes/-shes/-ches -> strip es', () => {
    expect(singularize('tomatoes')).toBe('tomato')
    expect(singularize('potatoes')).toBe('potato')
    expect(singularize('dishes')).toBe('dish')
    expect(singularize('peaches')).toBe('peach')
  })

  it('does not strip a plain double-s ending', () => {
    expect(singularize('glass')).toBe('glass')
    expect(singularize('watercress')).toBe('watercress')
  })

  // singularize is a lossy stemmer: its only contract is that the SAME
  // transform is applied to both the query and the corpus. Mass nouns like
  // "molasses" get mangled, but symmetrically — so search still matches (see
  // the matchesQuery symmetry test below). We don't try to preserve them.
  it('is a stable idempotent transform (same input -> same output)', () => {
    expect(singularize(singularize('molasses'))).toBe(singularize('molasses'))
  })

  it('leaves short words and singulars alone', () => {
    expect(singularize('oil')).toBe('oil')
    expect(singularize('feta')).toBe('feta')
    expect(singularize('as')).toBe('as')
  })
})

describe('normalizeTokens', () => {
  it('lowercases, splits on non-alphanumerics, and singularizes', () => {
    expect(normalizeTokens('2 cups Watermelon, cubed')).toEqual([
      '2',
      'cup',
      'watermelon',
      'cubed',
    ])
  })
})

describe('matchesQuery', () => {
  const recipe = makeRecipe({
    title: 'Watermelon Feta Salad',
    ingredients: ['2 cups watermelon, cubed', '1/4 cup crumbled feta'],
    notes: 'great for the smoker',
    instructions: ['Combine the zucchini and toss'], // must NOT be searched
  })

  it('matches a plural query against a singular ingredient', () => {
    expect(matchesQuery(recipe, 'watermelons')).toBe(true)
  })

  it('matches a singular query against the text', () => {
    expect(matchesQuery(recipe, 'watermelon')).toBe(true)
  })

  it('searches title and notes too', () => {
    expect(matchesQuery(recipe, 'salad')).toBe(true)
    expect(matchesQuery(recipe, 'smoker')).toBe(true)
  })

  it('does NOT search instructions', () => {
    expect(matchesQuery(recipe, 'zucchini')).toBe(false)
  })

  it('does not conflate unrelated food words', () => {
    expect(matchesQuery(recipe, 'lemon')).toBe(false)
  })

  it('ANDs multiple query words', () => {
    expect(matchesQuery(recipe, 'watermelon feta')).toBe(true)
    expect(matchesQuery(recipe, 'watermelon chicken')).toBe(false)
  })

  it('an empty query matches everything', () => {
    expect(matchesQuery(recipe, '')).toBe(true)
    expect(matchesQuery(recipe, '   ')).toBe(true)
  })

  it('matches mass nouns symmetrically despite lossy stemming', () => {
    const molassesRecipe = makeRecipe({
      title: 'Gingerbread',
      ingredients: ['1/4 cup molasses'],
    })
    expect(matchesQuery(molassesRecipe, 'molasses')).toBe(true)
  })
})

describe('filterRecipes', () => {
  const salad = makeRecipe({
    id: 'salad',
    title: 'Watermelon Salad',
    ingredients: ['watermelon', 'feta'],
    tags: ['sides', 'snack'],
    status: 'to_try',
  })
  const soup = makeRecipe({
    id: 'soup',
    title: 'Tomato Soup',
    ingredients: ['tomatoes', 'basil'],
    tags: ['dinner'],
    status: 'tried',
    rating: 'up',
    triedAt: new Date(),
  })
  const recipes = [salad, soup]

  it('filters by stage', () => {
    expect(filterRecipes(recipes, { status: 'to_try' })).toEqual([salad])
    expect(filterRecipes(recipes, { status: 'tried' })).toEqual([soup])
  })

  it('filters by tag (any-of)', () => {
    expect(filterRecipes(recipes, { tags: ['sides'] })).toEqual([salad])
    expect(filterRecipes(recipes, { tags: ['dinner', 'snack'] })).toEqual([
      salad,
      soup,
    ])
  })

  it('filters by query', () => {
    expect(filterRecipes(recipes, { query: 'tomato' })).toEqual([soup])
  })

  it('combines stage, tag, and query', () => {
    expect(
      filterRecipes(recipes, { status: 'to_try', tags: ['sides'], query: 'watermelons' })
    ).toEqual([salad])
    expect(
      filterRecipes(recipes, { status: 'tried', tags: ['sides'] })
    ).toEqual([])
  })

  it('returns everything with no filter', () => {
    expect(filterRecipes(recipes)).toEqual(recipes)
  })
})
