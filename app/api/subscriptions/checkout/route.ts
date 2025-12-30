import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSubscriptionCheckoutSession, getOrCreateCustomer, STRIPE_PRICE_IDS, PlanType } from "@/lib/stripe";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();

    if (!plan || (plan !== 'starter' && plan !== 'pro')) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'starter' or 'pro'" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // No-op for server-side
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has already had a trial
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('had_trial, trial_end')
      .eq('user_id', user.id)
      .single();

    // Determine if user is eligible for trial
    let trialDays = 0;
    if (subscription?.had_trial) {
      // User already had a trial - no trial for you!
      console.log(`User ${user.id} already had a trial, creating subscription without trial`);
      trialDays = 0;
    } else {
      // First time subscriber - give them the 14 day trial
      trialDays = 14;
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(user.id, user.email);

    // Get the price ID for the selected plan
    const priceId = STRIPE_PRICE_IDS[plan as PlanType];

    if (!priceId || priceId.includes('placeholder')) {
      return NextResponse.json(
        { error: "Stripe price ID not configured. Please set STRIPE_STARTER_PRICE_ID and STRIPE_PRO_PRICE_ID environment variables." },
        { status: 500 }
      );
    }

    // Determine base URL - prefer env var, fallback to request origin, then defaults
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      // Try to get from request headers
      const origin = request.headers.get('origin') || request.headers.get('referer');
      if (origin) {
        try {
          const url = new URL(origin);
          baseUrl = `${url.protocol}//${url.host}`;
        } catch {
          // Invalid URL, use default
        }
      }
    }
    // Final fallback
    baseUrl = baseUrl || (process.env.NODE_ENV === 'production' ? 'https://affinitybots.com' : 'http://localhost:3000');

    // Create checkout session (with or without trial based on eligibility)
    const session = await createSubscriptionCheckoutSession({
      priceId,
      customerId: customer.id,
      userId: user.id,
      successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/pricing`,
      trialPeriodDays: trialDays,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Subscription checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

