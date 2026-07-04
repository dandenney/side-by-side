import Link from 'next/link'
import { ThumbsUp, ThumbsDown, UtensilsCrossed } from 'lucide-react'
import { Recipe } from '@/types/recipe'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-950/5 transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-purple-100">
        {recipe.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-purple-300">
            <UtensilsCrossed className="size-8" />
          </div>
        )}

        {recipe.status === 'tried' && recipe.rating && (
          <span
            className={`absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-white shadow ${
              recipe.rating === 'up' ? 'bg-green-500' : 'bg-rose-500'
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
        <h3 className="font-medium text-purple-900 leading-snug line-clamp-2">
          {recipe.title}
        </h3>
        {recipe.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600"
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
