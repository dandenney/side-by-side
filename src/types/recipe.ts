// Recipe Tracker types. See CONTEXT.md and docs/adr/0001 for the domain model.

export type RecipeStatus = 'to_try' | 'tried'
export type RecipeRating = 'up' | 'down'

// Fixed, app-defined tag vocabulary. Extend here (no migration needed — tags is text[]).
export const RECIPE_TAGS = [
  'breakfast',
  'lunch',
  'dinner',
  'sides',
  'dessert',
  'snack',
  'drinks',
  'sauces',
  'seasonings',
] as const

export type RecipeTag = (typeof RECIPE_TAGS)[number]

export interface Recipe {
  id: string
  title: string
  ingredients: string[] // raw lines as imported; searchable
  instructions: string[] // numbered steps; NOT searched
  imageUrl?: string
  sourceUrl?: string // optional, manually added; the rewatchable video
  servings?: string
  tags: string[] // subset of RecipeTag; stored loosely as text[]
  status: RecipeStatus
  rating?: RecipeRating // only present once tried
  triedAt?: Date // stamped on the one-way to_try -> tried transition
  notes?: string // editable at any stage; searchable
  createdAt: Date
  updatedAt: Date
}

// Fields settable when creating a recipe. It always starts in the `to_try`
// stage, so status/rating/triedAt are not part of the input.
export interface NewRecipe {
  title: string
  ingredients?: string[]
  instructions?: string[]
  imageUrl?: string
  sourceUrl?: string
  servings?: string
  tags?: string[]
  notes?: string
}

// Fields editable on an existing recipe. The stage (status/rating/triedAt) is
// changed only via markRecipeTried — never here — to preserve the invariant.
export type RecipeEdit = Partial<
  Pick<
    Recipe,
    | 'title'
    | 'ingredients'
    | 'instructions'
    | 'imageUrl'
    | 'sourceUrl'
    | 'servings'
    | 'tags'
    | 'notes'
  >
>
