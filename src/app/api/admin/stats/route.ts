// app/api/admin/stats/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    // ตรวจสอบการเข้าสู่ระบบ
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const [
      destinationsCount,
      restaurantsCount,
      accommodationsCount,
      reviewsCount,
      recentReviews,
      categoryBreakdown,
      allRatings,
    ] = await Promise.all([
      supabaseAdmin
        .from("destinations")
        .select("id", {
          count: "exact",
          head: true,
        }),

      supabaseAdmin
        .from("restaurants")
        .select("id", {
          count: "exact",
          head: true,
        }),

      supabaseAdmin
        .from("accommodations")
        .select("id", {
          count: "exact",
          head: true,
        }),

      supabaseAdmin
        .from("reviews")
        .select("id", {
          count: "exact",
          head: true,
        }),

      supabaseAdmin
        .from("reviews")
        .select(`
          id,
          comment,
          rating,
          created_at,
          destination_id,
          restaurant_id,
          accommodation_id
        `)
        .order("created_at", {
          ascending: false,
        })
        .limit(5),

      supabaseAdmin
        .from("destinations")
        .select("category"),

      supabaseAdmin
        .from("reviews")
        .select("rating"),
    ]);

    const firstError =
      destinationsCount.error ||
      restaurantsCount.error ||
      accommodationsCount.error ||
      reviewsCount.error ||
      recentReviews.error ||
      categoryBreakdown.error ||
      allRatings.error;

    if (firstError) {
      throw firstError;
    }

    const destinationCategoryCounts: Record<string, number> = {};

    for (const item of categoryBreakdown.data ?? []) {
      const category = item.category?.trim() || "ไม่ระบุ";

      destinationCategoryCounts[category] =
        (destinationCategoryCounts[category] ?? 0) + 1;
    }

    const ratings = allRatings.data ?? [];

    const averageRating =
      ratings.length === 0
        ? 0
        : ratings.reduce(
            (sum, item) => sum + Number(item.rating ?? 0),
            0
          ) / ratings.length;

    return NextResponse.json({
      success: true,
      data: {
        totals: {
          destinations: destinationsCount.count ?? 0,
          restaurants: restaurantsCount.count ?? 0,
          accommodations: accommodationsCount.count ?? 0,
          reviews: reviewsCount.count ?? 0,
        },

        averageRating: Number(
          averageRating.toFixed(2)
        ),

        destinationCategoryCounts,

        recentReviews: recentReviews.data ?? [],
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN_STATS_API_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}