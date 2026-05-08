import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ plan: z.enum(["growth", "scale"]) });

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 });

  if (!process.env.STRIPE_SECRET_KEY) {
    // Demo mode return a fake session URL
    return NextResponse.json({
      demo_mode: true,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?demo_checkout=true&plan=${body.data.plan}`,
    });
  }

  // Real Stripe checkout
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const priceId =
      body.data.plan === "growth"
        ? process.env.STRIPE_PRICE_GROWTH!
        : process.env.STRIPE_PRICE_SCALE!;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Stripe error" }, { status: 500 });
  }
}
