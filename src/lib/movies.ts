/**
 * Movie search using OMDB API
 * OMDB provides movie information including IMDb IDs and URLs
 */

export interface MovieSearchResult {
  imdbId: string
  title: string
  year?: string
  type?: string
  poster?: string
}

export interface MovieDetailsResult extends MovieSearchResult {
  plot?: string
  director?: string
  actors?: string
  genre?: string
  rating?: string
  runtime?: string
  imdbUrl: string
}

/**
 * Search for movies by title
 * @param query - Movie title to search for
 * @returns Array of movie search results
 */
export async function searchMovies(query: string): Promise<MovieSearchResult[]> {
  if (!process.env.OMDB_API_KEY) {
    throw new Error('OMDB API key is not configured')
  }

  try {
    const apiKey = process.env.OMDB_API_KEY
    if (!apiKey) {
      throw new Error('OMDB API key is not configured')
    }

    const url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}&type=movie`
    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('OMDB API key is invalid or not activated. Please check your API key and ensure you have activated it via the email confirmation link from OMDB.')
      }
      throw new Error(`OMDB API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.Response === 'False') {
      // Handle specific error cases
      if (data.Error === 'Movie not found!' || data.Error === 'Too many results.') {
        return []
      }
      throw new Error(`OMDB API error: ${data.Error || 'Unknown error'}`)
    }

    if (!data.Search || !Array.isArray(data.Search)) {
      return []
    }

    return data.Search
      .filter((movie: any) => movie.imdbID && movie.Title)
      .map((movie: any) => ({
        imdbId: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        type: movie.Type,
        poster: movie.Poster !== 'N/A' ? movie.Poster : undefined,
      }))
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Unexpected error searching movies: ${String(error)}`)
  }
}

/**
 * Get detailed movie information by IMDb ID
 * @param imdbId - IMDb ID of the movie
 * @returns Movie details including IMDb URL
 */
export async function getMovieDetails(imdbId: string): Promise<MovieDetailsResult> {
  if (!process.env.OMDB_API_KEY) {
    throw new Error('OMDB API key is not configured')
  }

  try {
    const apiKey = process.env.OMDB_API_KEY
    if (!apiKey) {
      throw new Error('OMDB API key is not configured')
    }

    const response = await fetch(
      `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${apiKey}&plot=full`
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('OMDB API key is invalid or not activated. Please check your API key and ensure you have activated it via the email confirmation link from OMDB.')
      }
      throw new Error(`OMDB API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.Response === 'False') {
      throw new Error(`OMDB API error: ${data.Error || 'Movie not found'}`)
    }

    // Generate IMDb URL
    const imdbUrl = `https://www.imdb.com/title/${imdbId}/`

    return {
      imdbId: data.imdbID,
      title: data.Title,
      year: data.Year,
      type: data.Type,
      poster: data.Poster !== 'N/A' ? data.Poster : undefined,
      plot: data.Plot !== 'N/A' ? data.Plot : undefined,
      director: data.Director !== 'N/A' ? data.Director : undefined,
      actors: data.Actors !== 'N/A' ? data.Actors : undefined,
      genre: data.Genre !== 'N/A' ? data.Genre : undefined,
      rating: data.imdbRating !== 'N/A' ? data.imdbRating : undefined,
      runtime: data.Runtime !== 'N/A' ? data.Runtime : undefined,
      imdbUrl,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Unexpected error getting movie details: ${String(error)}`)
  }
}

