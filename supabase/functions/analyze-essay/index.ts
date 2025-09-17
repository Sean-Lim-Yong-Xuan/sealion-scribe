import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 signing function
async function sign(key: Uint8Array, message: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return new Uint8Array(signature);
}

async function createSignatureKey(secretKey: string, dateStamp: string, regionName: string, serviceName: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const kDate = await sign(encoder.encode(`AWS4${secretKey}`), dateStamp);
  const kRegion = await sign(kDate, regionName);
  const kService = await sign(kRegion, serviceName);
  const kSigning = await sign(kService, 'aws4_request');
  return kSigning;
}

async function callBedrockAPI(region: string, accessKeyId: string, secretAccessKey: string, modelId: string, requestBody: string): Promise<any> {
  const service = 'bedrock-runtime';
  const host = `bedrock-runtime.${region}.amazonaws.com`;
  const endpoint = `https://${host}/model/${encodeURIComponent(modelId)}/invoke`;
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substr(0, 8);
  
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-date';
  
  const encoder = new TextEncoder();
  const payloadHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(requestBody))))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  const canonicalRequest = `POST\n/model/${encodeURIComponent(modelId)}/invoke\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n` +
    Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest))))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  
  const signingKey = await createSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = Array.from(await sign(signingKey, stringToSign))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': host,
      'X-Amz-Date': amzDate,
      'Authorization': authorizationHeader,
    },
    body: requestBody,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bedrock API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { essay } = await req.json();

    if (!essay || typeof essay !== 'string' || essay.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Essay text is required and cannot be empty' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const region = Deno.env.get('AWS_REGION') || 'us-east-1';
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')!;
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')!;

    // Prepare the prompt for essay analysis
    const analysisPrompt = `Please analyze the following essay and provide detailed feedback. Return your response in the following JSON format:

{
  "positiveFeedback": [
    "List specific positive aspects of the essay",
    "Such as strong arguments, good structure, clear writing",
    "Each item should be a complete sentence describing what was done well"
  ],
  "negativeFeedback": [
    "List specific areas for improvement",
    "Such as unclear arguments, weak evidence, grammatical issues",
    "Each item should be a complete sentence describing what needs work"
  ]
}

Essay to analyze:
"""
${essay}
"""

Focus on:
- Argument strength and logical flow
- Evidence and supporting details
- Writing clarity and organization
- Grammar and style
- Thesis development and conclusion

Provide constructive, specific feedback that helps the student improve their writing.`;

    // Create the request body for the Sealion model
    const requestBody = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: analysisPrompt
        }
      ]
    });

    console.log('Invoking Bedrock model for essay analysis...');
    
    // Call the Bedrock API directly
    const response = await callBedrockAPI(
      region,
      accessKeyId,
      secretAccessKey,
      "arn:aws:bedrock:us-east-1:116163866269:imported-model/d48xlm95eq5l",
      requestBody
    );
    
    console.log('Bedrock response:', response);

    let analysisResult;
    try {
      // Extract the content from Claude's response
      const content = response.content[0].text;
      
      // Try to parse the JSON response from the model
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing analysis result:', parseError);
      // Fallback: create structured feedback from raw text
      const content = response.content[0].text;
      analysisResult = {
        positiveFeedback: [
          "Analysis completed successfully",
          "Feedback has been generated for your essay"
        ],
        negativeFeedback: [
          "Please review the detailed feedback provided",
          content.substring(0, 200) + "..." // Truncated feedback
        ]
      };
    }

    // Validate the structure
    if (!analysisResult.positiveFeedback || !analysisResult.negativeFeedback) {
      throw new Error('Invalid analysis result structure');
    }

    console.log('Essay analysis completed successfully');

    return new Response(
      JSON.stringify({
        positiveFeedback: analysisResult.positiveFeedback,
        negativeFeedback: analysisResult.negativeFeedback,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-essay function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze essay. Please check your AWS configuration and try again.',
        details: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
