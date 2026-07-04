import { UtensilsCrossed } from 'lucide-react'

/**
 * Recipe photos arrive in wildly mixed shapes (portrait phone captures,
 * landscape food shots). This frame shows the whole photo with
 * object-contain and fills the letterbox with a blurred copy, so every
 * image sits in the same box without harsh cropping.
 */
export function RecipeImage({
  src,
  alt,
  className = '',
}: {
  src?: string | null
  alt: string
  className?: string
}) {
  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-xl"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="relative h-full w-full object-contain" />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-hue/30">
          <UtensilsCrossed className="size-10" />
        </div>
      )}
    </div>
  )
}
