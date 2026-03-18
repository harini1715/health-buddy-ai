import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a medical prescription OCR and analysis AI. You will receive a prescription image and must extract structured data from it.

Extract the following information and return it using the extract_prescription tool:
- date: The date on the prescription (format: YYYY-MM-DD). If not found, use today's date.
- hospitalName: The hospital or clinic name. If not found, use "Unknown Hospital".
- doctorName: The doctor's name. If not found, use "Unknown Doctor".
- medicines: An array of medicines with:
  - name: Medicine name with strength (e.g., "Paracetamol 500mg")
  - dosage: How much to take (e.g., "1 tablet", "2 puffs")
  - timing: When to take it (e.g., "Morning", "Night", "Morning & Night", "Morning, Afternoon & Night")
  - food: Food instruction (e.g., "Before food", "After food", "N/A")

Be thorough and extract ALL medicines mentioned. If handwriting is hard to read, make your best interpretation.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                  },
                },
                {
                  type: "text",
                  text: "Please extract all prescription details from this image.",
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_prescription",
                description:
                  "Extract structured prescription data from the image",
                parameters: {
                  type: "object",
                  properties: {
                    date: { type: "string", description: "Prescription date in YYYY-MM-DD format" },
                    hospitalName: { type: "string", description: "Hospital or clinic name" },
                    doctorName: { type: "string", description: "Doctor name" },
                    summary: { type: "string", description: "Brief summary of the prescription" },
                    medicines: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string", description: "Medicine name with strength" },
                          dosage: { type: "string", description: "Dosage amount" },
                          timing: { type: "string", description: "When to take" },
                          food: { type: "string", description: "Before food, After food, or N/A" },
                        },
                        required: ["name", "dosage", "timing", "food"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["date", "hospitalName", "doctorName", "medicines", "summary"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_prescription" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "AI could not extract prescription data" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-prescription error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
