import { NextRequest, NextResponse } from 'next/server'
import { validateSearchParams, apiSchemas, createValidationErrorResponse } from '@/lib/validation'

export const runtime = 'edge'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(request: NextRequest) {
  // Validate input parameters
  const validationResult = validateSearchParams(apiSchemas.metaFetch, request.nextUrl.searchParams)
  
  if (!validationResult.success) {
    const errorResponse = createValidationErrorResponse(request, validationResult.error, validationResult.issues)
    // Add CORS headers to error response
    corsHeaders && Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value)
    })
    return errorResponse
  }
  
  const { url } = validationResult.data

  try {
    // Ensure the URL is properly formatted
    let targetUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      targetUrl = `https://${url}`
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      }
    })
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { 
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      })
    }

    const html = await response.text()

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)
    const title = decodeEntities(ogTitleMatch?.[1] || titleMatch?.[1] || 'Untitled')

    // Extract description
    const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i)
    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)
    const description = decodeEntities(ogDescMatch?.[1] || metaDescMatch?.[1] || '')

    // Extract image
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i)
    const twitterImageMatch = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]*)"[^>]*>/i)
    let image = ogImageMatch?.[1] || twitterImageMatch?.[1] || ''

    // Convert relative image URLs to absolute
    if (image && !image.startsWith('http')) {
      const baseUrl = new URL(targetUrl)
      image = new URL(image, baseUrl.origin).toString()
    }

    return NextResponse.json({
      title,
      description,
      image,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error('Error fetching meta data:', error)
    return NextResponse.json({ error: 'Failed to fetch meta data' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
}

// Helper function to decode HTML entities
function decodeEntities(encodedString: string) {
  if (!encodedString) return ''
  
  // Common HTML entities
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&euro;': '€',
    '&pound;': '£',
    '&yen;': '¥',
    '&cent;': '¢',
    '&sect;': '§',
    '&deg;': '°',
    '&plusmn;': '±',
    '&times;': '×',
    '&divide;': '÷',
    '&micro;': 'µ',
    '&para;': '¶',
    '&middot;': '·',
    '&ndash;': '–',
    '&mdash;': '—',
    '&lsquo;': '‘',
    '&rsquo;': '’',
    '&ldquo;': '“',
    '&rdquo;': '”',
    '&bull;': '•',
    '&hellip;': '…',
    '&prime;': '′',
    '&Prime;': '″',
    '&oline;': '‾',
    '&frasl;': '⁄',
    '&weierp;': '℘',
    '&image;': 'ℑ',
    '&real;': 'ℜ',
    '&alefsym;': 'ℵ',
    '&larr;': '←',
    '&uarr;': '↑',
    '&rarr;': '→',
    '&darr;': '↓',
    '&harr;': '↔',
    '&crarr;': '↵',
    '&lArr;': '⇐',
    '&uArr;': '⇑',
    '&rArr;': '⇒',
    '&dArr;': '⇓',
    '&hArr;': '⇔',
    '&forall;': '∀',
    '&part;': '∂',
    '&exist;': '∃',
    '&empty;': '∅',
    '&nabla;': '∇',
    '&isin;': '∈',
    '&notin;': '∉',
    '&ni;': '∋',
    '&prod;': '∏',
    '&sum;': '∑',
    '&minus;': '−',
    '&lowast;': '∗',
    '&radic;': '√',
    '&prop;': '∝',
    '&infin;': '∞',
    '&ang;': '∠',
    '&and;': '∧',
    '&or;': '∨',
    '&cap;': '∩',
    '&cup;': '∪',
    '&int;': '∫',
    '&there4;': '∴',
    '&sim;': '∼',
    '&cong;': '≅',
    '&asymp;': '≈',
    '&ne;': '≠',
    '&equiv;': '≡',
    '&le;': '≤',
    '&ge;': '≥',
    '&sub;': '⊂',
    '&sup;': '⊃',
    '&nsub;': '⊄',
    '&sube;': '⊆',
    '&supe;': '⊇',
    '&oplus;': '⊕',
    '&otimes;': '⊗',
    '&perp;': '⊥',
    '&sdot;': '⋅',
    '&lceil;': '⌈',
    '&rceil;': '⌉',
    '&lfloor;': '⌊',
    '&rfloor;': '⌋',
    '&lang;': '〈',
    '&rang;': '〉',
    '&loz;': '◊',
    '&spades;': '♠',
    '&clubs;': '♣',
    '&hearts;': '♥',
    '&diams;': '♦'
  }

  return encodedString.replace(/&[^;]+;/g, match => entities[match] || match)
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
} 