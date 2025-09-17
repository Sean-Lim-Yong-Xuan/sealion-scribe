import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { BedrockRuntimeClient, InvokeModelCommand } from "https://esm.sh/@aws-sdk/client-bedrock-runtime@3.888.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { essay } = await req.json();
    if (!essay || typeof essay !== "string" || essay.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Essay text is required and cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bedrockClient = new BedrockRuntimeClient({
      region: Deno.env.get("AWS_REGION") || "us-east-1",
      credentials: {
        accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
        secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
      },
    });

    const analysisPrompt = `Please analyze the following essay and provide detailed feedback... (your same prompt here)`;

    const command = new InvokeModelCommand({
      modelId: "arn:aws:bedrock:us-east-1:116163866269:imported-model/d48xlm95eq5l",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: analysisPrompt }]
          }
        ]
      }),
    });

    console.log("Invoking Bedrock model for essay analysis...");
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log("Bedrock response:", responseBody);

    let analysisResult;
    try {
      const content = responseBody.content?.[0]?.text ?? "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      analysisResult = null;
    }

    if (!analysisResult) {
      analysisResult = {
        positiveFeedback: ["We analyzed your essay successfully."],
        negativeFeedback: ["We couldn't parse detailed JSON feedback, but here is the raw response.", responseBody.content?.[0]?.text ?? ""],
      };
    }

    return new Response(JSON.stringify({ ...analysisResult, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-essay function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze essay", details: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
