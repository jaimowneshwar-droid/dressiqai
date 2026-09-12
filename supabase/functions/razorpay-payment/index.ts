import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

if (import.meta.main) {
  Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      const url = new URL(req.url);
      const path = url.pathname.split("/razorpay-payment/")[1] ?? "";

      if (path === "create-order" && req.method === "POST") {
        return await handleCreateOrder(req);
      }
      if (path === "verify-payment" && req.method === "POST") {
        return await handleVerifyPayment(req);
      }

      return new Response(
        JSON.stringify({ error: "Not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  });
}

async function getRazorpayKeys() {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET as edge function secrets.");
  }
  return { keyId, keySecret };
}

async function handleCreateOrder(req: Request) {
  const { order_id, amount } = await req.json() as { order_id: string; amount: number };

  if (!order_id || !amount || amount <= 0) {
    return new Response(
      JSON.stringify({ error: "order_id and positive amount are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { keyId, keySecret } = await getRazorpayKeys();
  const auth = btoa(`${keyId}:${keySecret}`);

  const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: order_id,
      payment_capture: 1,
    }),
  });

  if (!razorpayRes.ok) {
    const errBody = await razorpayRes.text();
    return new Response(
      JSON.stringify({ error: `Razorpay order creation failed: ${errBody}` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const razorpayOrder = await razorpayRes.json() as {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
  };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  await supabase
    .from("orders")
    .update({ razorpay_order_id: razorpayOrder.id })
    .eq("id", order_id);

  return new Response(
    JSON.stringify({
      razorpay_order_id: razorpayOrder.id,
      razorpay_key_id: keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleVerifyPayment(req: Request) {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    order_id,
  } = await req.json() as {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    order_id: string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
    return new Response(
      JSON.stringify({ error: "Missing required payment verification fields" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { keySecret } = await getRazorpayKeys();

  const keyData = new TextEncoder().encode(keySecret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(`${razorpay_order_id}|${razorpay_payment_id}`)
  );

  const expectedHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expectedHex !== razorpay_signature) {
    return new Response(
      JSON.stringify({ error: "Payment signature verification failed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", order_id)
    .eq("razorpay_order_id", razorpay_order_id);

  if (error) {
    return new Response(
      JSON.stringify({ error: "Failed to update order payment status" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ verified: true, message: "Payment verified successfully" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
