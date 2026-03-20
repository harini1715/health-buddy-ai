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

    const systemPrompt = `You are an expert medical prescription OCR and pharmacology AI. You will receive a prescription image and must extract structured data from it.

CRITICAL MEDICINE NAME RULES:
- Always output the FULL, CORRECT, COMPLETE medicine name — never abbreviations or garbled OCR text.
- If OCR produces partial or misspelled names, use your pharmaceutical knowledge to identify and correct them to the proper medicine name.
- Include the brand name AND/OR generic name as written on the prescription.
- Always include the strength/dosage form (e.g., "Paracetamol 500mg Tablet", "Amoxicillin 250mg Capsule", "Pantoprazole 40mg Tablet").
- Common corrections: "Pcm" → "Paracetamol", "Amox" → "Amoxicillin", "Azithro" → "Azithromycin", "Panto" → "Pantoprazole", "Metro" → "Metronidazole", etc.
- If a medicine name is completely unreadable, still provide your best pharmacological guess based on context (other medicines, dosage patterns, specialty of doctor).

Extract the following information and return it using the extract_prescription tool:
- date: The date on the prescription (format: YYYY-MM-DD). If not found, use today's date.
- hospitalName: The hospital or clinic name. If not found, use "Unknown Hospital".
- doctorName: The doctor's name (include qualifications if visible, e.g., "Dr. Sharma, MBBS"). If not found, use "Unknown Doctor".
- summary: A brief clinical summary of what the prescription is for (e.g., "Treatment for viral fever with antibiotics and supportive care").
- medicines: An array of ALL medicines with:
  - name: Full correct medicine name with strength and form (e.g., "Paracetamol 500mg Tablet")
  - dosage: How much to take (e.g., "1 tablet", "10ml", "2 puffs")
  - timing: When to take it (e.g., "Morning & Night", "Morning, Afternoon & Night", "Once daily at bedtime")
  - food: Food instruction (e.g., "Before food", "After food", "With food", "N/A")

Be thorough and extract ALL medicines mentioned. Double-check every medicine name for accuracy.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
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

    const responseText = await response.text();
    console.log("AI response length:", responseText.length, "first 200 chars:", responseText.substring(0, 200));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Failed to parse AI response as JSON. Response text:", responseText.substring(0, 1000));
      return new Response(
        JSON.stringify({ error: "AI returned invalid response. Please try again with a clearer image." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response structure:", JSON.stringify({
      hasChoices: !!data.choices,
      choiceCount: data.choices?.length,
      finishReason: data.choices?.[0]?.finish_reason,
      hasToolCalls: !!data.choices?.[0]?.message?.tool_calls,
      toolCallCount: data.choices?.[0]?.message?.tool_calls?.length,
      hasContent: !!data.choices?.[0]?.message?.content,
    }));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      // Fallback: try to parse from content if model responded with text instead of tool call
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log("No tool call, trying to parse content as JSON. Content:", content.substring(0, 500));
        try {
          // Try to find JSON in the content
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.medicines) {
              return new Response(JSON.stringify(parsed), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
        } catch (parseErr) {
          console.error("Failed to parse content as JSON:", parseErr);
        }
      }
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "AI could not extract prescription data" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    console.log("Extracted medicines count:", extracted.medicines?.length);

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
