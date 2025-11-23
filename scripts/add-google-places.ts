/**
 * Google Places API - Get Business Reviews and Ratings
 * 
 * Requirements:
 * - Same API key as PageSpeed Insights (GOOGLE_PAGESPEED_API_KEY)
 * - Enable "Places API" in Google Cloud Console
 * 
 * Rate Limits:
 * - Free tier: $200 credit/month
 * - Cost: $0.017 per request after free tier
 */
import axios from "axios";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY; // Same key
const PLACES_API_URL = "https://maps.googleapis.com/maps/api/place";

export async function getGooglePlacesReviews(params: {
  placeId?: string;
  businessName?: string;
  address?: string;
}): Promise<{
  rating: number | null;
  totalRatings: number | null;
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    time: number;
  }>;
  placeId: string | null;
} | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.log("⚠️  Google Places API key not configured");
    return null;
  }

  try {
    let placeId = params.placeId;

    // If no placeId, search for the business first
    if (!placeId && (params.businessName || params.address)) {
      const searchQuery = params.businessName 
        ? `${params.businessName} ${params.address || ''}`.trim()
        : params.address || '';
      
      const searchResponse = await axios.get(`${PLACES_API_URL}/textsearch/json`, {
        params: {
          query: searchQuery,
          key: GOOGLE_PLACES_API_KEY
        }
      });

      const results = searchResponse.data?.results || [];
      if (results.length > 0) {
        placeId = results[0].place_id;
      } else {
        return null;
      }
    }

    if (!placeId) {
      return null;
    }

    // Get place details including reviews
    const detailsResponse = await axios.get(`${PLACES_API_URL}/details/json`, {
      params: {
        place_id: placeId,
        key: GOOGLE_PLACES_API_KEY,
        fields: 'name,rating,user_ratings_total,reviews'
      }
    });

    const result = detailsResponse.data?.result;
    if (!result) {
      return null;
    }

    return {
      rating: result.rating || null,
      totalRatings: result.user_ratings_total || null,
      reviews: (result.reviews || []).map((review: any) => ({
        author: review.author_name || 'Anonymous',
        rating: review.rating || 0,
        text: review.text || '',
        time: review.time || 0
      })),
      placeId: placeId
    };
  } catch (error: any) {
    console.error("Google Places API error:", error.message);
    return null;
  }
}

