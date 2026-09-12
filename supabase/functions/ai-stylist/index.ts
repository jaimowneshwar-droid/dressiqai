import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-flash-latest",
];

interface GeminiResponse {
  text: string;
  modelUsed: string;
}

async function callGeminiAPI(
  contents: unknown,
  systemInstruction: { parts: { text: string }[] },
  generationConfig: { temperature: number; maxOutputTokens: number; responseMimeType?: string },
): Promise<GeminiResponse> {
  let lastError = "";

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({ contents, systemInstruction, generationConfig }),
          },
        );

        if (res.status === 404) {
          const errBody = await res.text();
          console.error(`Gemini 404 (model=${model}) — skipping:`, errBody.slice(0, 200));
          lastError = "Model unavailable";
          break;
        }

        if (res.status === 429 || res.status === 503) {
          const errBody = await res.text();
          console.error(`Gemini ${res.status} (model=${model}, attempt=${attempt}):`, errBody.slice(0, 300));
          const isQuotaExhausted = errBody.includes("exceeded your current quota") || errBody.includes("RESOURCE_EXHAUSTED");
          if (isQuotaExhausted) {
            lastError = "quota_exhausted";
            break;
          }
          lastError = "busy";
          if (attempt < 1) {
            await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
            continue;
          }
          break;
        }

        if (!res.ok) {
          const errBody = await res.text();
          console.error(`Gemini ${res.status} (model=${model}):`, errBody.slice(0, 400));
          let apiMsg = "";
          try { apiMsg = JSON.parse(errBody)?.error?.message || ""; } catch { /* ignore */ }
          lastError = apiMsg || `Gemini returned ${res.status}`;
          break;
        }

        const data = await res.json();

        if (data?.candidates?.[0]?.finishReason === "SAFETY") {
          lastError = "Response blocked by safety filters";
          break;
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          console.error(`Gemini empty response (model=${model}):`, JSON.stringify(data).slice(0, 400));
          lastError = "Gemini returned an empty response";
          break;
        }
        return { text, modelUsed: model };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (lastError === "quota_exhausted") break;
  }

  if (lastError === "quota_exhausted") {
    throw new Error("Daily AI quota reached. Please try again tomorrow, or upgrade your Gemini API plan.");
  }
  if (lastError === "busy") {
    throw new Error("The AI service is busy right now. Please try again in a moment.");
  }
  throw new Error(lastError || "Gemini API request failed");
}

interface AIConfig {
  systemPrompt: string;
}

function tryParseJSON<T>(text: string): T | null {
  try {
    let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      cleaned = cleaned.slice(start, end + 1);
    }
    return JSON.parse(cleaned) as T;
  } catch {
    console.error("Failed to parse JSON from AI response:", text.slice(0, 500));
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI is not configured. GEMINI_API_KEY environment variable is missing." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: settings } = await supabase
      .from("app_settings")
      .select("*")
      .maybeSingle();

    const aiEnabled = settings?.ai_enabled ?? false;
    if (!aiEnabled) {
      return new Response(
        JSON.stringify({ error: "AI features are currently disabled." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const config: AIConfig = {
      systemPrompt: settings?.ai_system_prompt || "You are DressIQ, a fashion AI assistant.",
    };

    const body = await req.json();
    const mode = body.mode || "chat";

    // ---- CHAT MODE ----
    if (mode === "chat") {
      const { message, history } = body;
      if (!message) {
        return new Response(
          JSON.stringify({ error: "Message is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const chatSystemPrompt = `${config.systemPrompt}

Rules:
- Keep replies short and simple (2-3 sentences max).
- If the user writes in Tamil, reply in Tamil.
- Never open Gallery, Camera, or Microphone automatically. Always ask the user for permission first if they want to use those features.`;

      const rawHistory = (history || []).map((m: { role: string; text: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));
      let startIdx = 0;
      while (startIdx < rawHistory.length && rawHistory[startIdx].role !== "user") {
        startIdx++;
      }
      const contents = rawHistory.slice(startIdx);
      contents.push({ role: "user", parts: [{ text: message }] });

      const { text: reply } = await callGeminiAPI(
        contents,
        { parts: [{ text: chatSystemPrompt }] },
        { temperature: 0.7, maxOutputTokens: 512 },
      );

      return new Response(
        JSON.stringify({ reply }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- SIZE MODE ----
    if (mode === "size") {
      const { height, weight, age, gender, bodyType } = body;
      const prompt = `You are a fashion sizing expert. Based on the following measurements, recommend the best clothing size.
Return ONLY valid JSON (no markdown) with this exact structure:
{
  "recommendedSize": "M",
  "confidence": "High",
  "notes": "Brief fit advice",
  "measurements": {
    "chest": "38",
    "waist": "32",
    "hip": "40",
    "shoulder": "17.5"
  }
}

Measurements:
- Height: ${height} cm
- Weight: ${weight} kg
- Age: ${age || "N/A"}
- Gender: ${gender}
- Body Type: ${bodyType}

Use Indian clothing size standards (XS, S, M, L, XL, XXL). Measurements in inches.`;

      const { text: result } = await callGeminiAPI(
        [{ parts: [{ text: prompt }] }],
        { parts: [{ text: config.systemPrompt }] },
        { temperature: 0.7, maxOutputTokens: 1024, responseMimeType: "application/json" },
      );
      const parsed = tryParseJSON(result);

      if (parsed) {
        try {
          await supabase.from("ai_recommendations").insert({
            type: "size",
            input: { height, weight, age, gender, bodyType },
            result: parsed,
          });
        } catch (dbErr) {
          console.error("DB insert failed for size:", dbErr.message);
        }
        return new Response(
          JSON.stringify(parsed),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ error: "AI could not generate a size recommendation. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- OUTFIT MODE ----
    if (mode === "outfit") {
      const { budget, occasion, style, season, preferences } = body;
      const prompt = `You are a fashion stylist AI. Create a complete outfit recommendation.
Return ONLY valid JSON (no markdown) with this exact structure:
{
  "outfitName": "Outfit Name",
  "description": "Brief description of the look",
  "items": [
    { "category": "Top", "name": "Item name", "estimatedPrice": "₹500" },
    { "category": "Bottom", "name": "Item name", "estimatedPrice": "₹800" }
  ],
  "totalEstimate": "₹1,300",
  "tips": "Styling tips"
}

Requirements:
- Budget: ₹${budget}
- Occasion: ${occasion}
- Style: ${style}
- Season: ${season}
- Preferences: ${preferences || "None"}
- All prices in INR (₹)
- 3-5 items per outfit
- Keep total within budget`;

      const { text: result } = await callGeminiAPI(
        [{ parts: [{ text: prompt }] }],
        { parts: [{ text: config.systemPrompt }] },
        { temperature: 0.7, maxOutputTokens: 1024, responseMimeType: "application/json" },
      );
      const parsed = tryParseJSON(result);

      if (parsed) {
        try {
          await supabase.from("ai_recommendations").insert({
            type: "outfit",
            input: { budget, occasion, style, season, preferences },
            result: parsed,
          });
        } catch (dbErr) {
          console.error("DB insert failed for outfit:", dbErr.message);
        }
        return new Response(
          JSON.stringify(parsed),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ error: "AI could not generate an outfit plan. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- TRYON MODE ----
    if (mode === "tryon") {
      const { imageBase64, imageMime, garment, color, productImage, productName, productPrice } = body;

      if (!imageBase64) {
        return new Response(
          JSON.stringify({ error: "No image provided. Please upload a photo to use Virtual Try-On." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const userMime = (imageMime && imageMime.startsWith("image/")) ? imageMime : "image/jpeg";

      const parts: unknown[] = [
        { inlineData: { mimeType: userMime, data: imageBase64 } },
      ];

      let productImageBase64: string | null = null;
      let productImageMime = "image/jpeg";
      if (productImage) {
        try {
          const imgRes = await fetch(productImage);
          if (imgRes.ok) {
            const contentType = imgRes.headers.get("content-type") || "";
            if (contentType.startsWith("image/")) productImageMime = contentType;
            const imgBuf = await imgRes.arrayBuffer();
            const bytes = new Uint8Array(imgBuf);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            productImageBase64 = btoa(binary);
          }
        } catch (fetchErr) {
          console.error("Failed to fetch product image:", fetchErr.message);
        }
      }

      if (productImageBase64) {
        parts.push({ inlineData: { mimeType: productImageMime, data: productImageBase64 } });
      }

      const garmentLabel = productName || garment || "the selected garment";
      const colorLabel = color || "default";

      const prompt = `You are a virtual fashion try-on AI assistant with image analysis capabilities.
${productImageBase64
  ? `The first image is the user's photo. The second image is the product "${garmentLabel}" they want to try on. Analyze how this garment would look on the person in the first photo.`
  : `The user uploaded their photo and wants to try on a ${garmentLabel} in ${colorLabel}. Analyze the person's visible features in the photo.`}

Return ONLY valid JSON (no markdown):
{
  "description": "How ${garmentLabel} would look on this person",
  "fitScore": "Perfect Fit / Good Fit / Slim Fit / Relaxed Fit / Tailored Fit",
  "recommendations": "Specific styling advice",
  "colorAnalysis": "How ${colorLabel} complements this person"
}`;

      parts.push({ text: prompt });

      const { text: result } = await callGeminiAPI(
        [{ role: "user", parts }],
        { parts: [{ text: config.systemPrompt }] },
        { temperature: 0.7, maxOutputTokens: 1024 },
      );
      const parsed = tryParseJSON(result);

      if (parsed) {
        try {
          await supabase.from("ai_recommendations").insert({
            type: "tryon",
            input: { garment, color, productName, productPrice },
            result: parsed,
          });
        } catch (dbErr) {
          console.error("DB insert failed for tryon:", dbErr.message);
        }
        return new Response(
          JSON.stringify(parsed),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ error: "AI could not parse the result. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown mode" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("AI Stylist error:", err.message);
    const msg: string = err.message || "Internal server error";
    const isQuota = msg.includes("Daily AI quota");
    const isBusy = msg.includes("busy");
    return new Response(
      JSON.stringify({ error: msg }),
      {
        status: isQuota ? 429 : isBusy ? 503 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
