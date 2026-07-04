import Link from 'next/link'
import { ThumbsUp, ThumbsDown, UtensilsCrossed } from 'lucide-react'
import { Recipe } from '@/types/recipe'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="card group flex flex-col overflow-hidden transition-shadow duration-150 hover:shadow-pop"
    >
      <div className="relative aspect-square bg-surface-2">
        {recipe.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-hue/30">
            <UtensilsCrossed className="size-8" />
          </div>
        )}

        {recipe.status === 'tried' && recipe.rating && (
          <span
            className={`absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-white shadow ${
              recipe.rating === 'up' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
            aria-label={recipe.rating === 'up' ? 'Thumbs up' : 'Thumbs down'}
          >
            {recipe.rating === 'up' ? (
              <ThumbsUp className="size-4" />
            ) : (
              <ThumbsDown className="size-4" />
            )}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="font-medium leading-snug text-ink line-clamp-2">
          {recipe.title}
        </h3>
        {recipe.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-tint px-2 py-0.5 text-xs font-medium text-tint-ink"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
