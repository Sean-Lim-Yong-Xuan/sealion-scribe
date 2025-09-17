import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS SDK v3 compatible implementation for Bedrock Runtime
class BedrockRuntimeClient {
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor(config: { region: string; credentials: { accessKeyId: string; secretAccessKey: string } }) {
    this.region = config.region;
    this.accessKeyId = config.credentials.accessKeyId;
    this.secretAccessKey = config.credentials.secretAccessKey;
  }

  async send(command: InvokeModelCommand): Promise<any> {
    return await this.invokeModel(command.modelId, command.body);
  }

  private async invokeModel(modelId: string, requestBody: string): Promise<any> {
    const service = 'bedrock-runtime';
    const host = `bedrock-runtime.${this.region}.amazonaws.com`;
    const endpoint = `https://${host}/model/${encodeURIComponent(modelId)}/invoke`;
    
    console.log(`Invoking Bedrock model: ${modelId}`);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Region: ${this.region}`);
    
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substr(0, 8);
    
    // Create canonical request
    const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-date';
    
    const encoder = new TextEncoder();
    const payloadHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(requestBody))))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    const canonicalRequest = `POST\n/model/${encodeURIComponent(modelId)}/invoke\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    
    // Create string to sign
    const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n` +
      Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest))))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Create signing key
    const signingKey = await this.createSignatureKey(this.secretAccessKey, dateStamp, this.region, service);
    
    // Create signature
    const signature = Array.from(await this.sign(signingKey, stringToSign))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    console.log('Making authenticated request to Bedrock...');
    
    // Make the request
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
    
    console.log(`Bedrock response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Bedrock API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Bedrock API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const responseBody = await response.json();
    console.log('Bedrock response received successfully');
    
    return {
      body: new TextEncoder().encode(JSON.stringify(responseBody))
    };
  }

  private async sign(key: Uint8Array, message: string): Promise<Uint8Array> {
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

  private async createSignatureKey(secretKey: string, dateStamp: string, regionName: string, serviceName: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const kDate = await this.sign(encoder.encode(`AWS4${secretKey}`), dateStamp);
    const kRegion = await this.sign(kDate, regionName);
    const kService = await this.sign(kRegion, serviceName);
    const kSigning = await this.sign(kService, 'aws4_request');
    return kSigning;
  }
}

// Command class for compatibility with AWS SDK v3
class InvokeModelCommand {
  public modelId: string;
  public body: string;
  public contentType: string;

  constructor(input: { modelId: string; body: string; contentType: string }) {
    this.modelId = input.modelId;
    this.body = input.body;
    this.contentType = input.contentType;
  }
}

// Main function to analyze essay with Bedrock
async function analyzeEssayWithBedrock(essayText: string, awsCredentials: { accessKeyId: string; secretAccessKey: string; region: string }) {
  try {
    console.log('Initializing Bedrock client...');
    
    const client = new BedrockRuntimeClient({
      region: awsCredentials.region,
      credentials: {
        accessKeyId: awsCredentials.accessKeyId,
        secretAccessKey: awsCredentials.secretAccessKey,
      },
    });

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
${essayText}
"""

Focus on:
- Argument strength and logical flow
- Evidence and supporting details
- Writing clarity and organization
- Grammar and style
- Thesis development and conclusion

Provide constructive, specific feedback that helps the student improve their writing.`;

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

    console.log('Preparing model invocation...');

    const command = new InvokeModelCommand({
      modelId: "arn:aws:bedrock:us-east-1:116163866269:imported-model/d48xlm95eq5l",
      body: requestBody,
      contentType: "application/json",
    });

    console.log('Sending request to Bedrock...');
    
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log('Received response from Bedrock, parsing content...');
    
    // Extract content from the response
    let content = '';
    if (responseBody.content && Array.isArray(responseBody.content) && responseBody.content.length > 0) {
      content = responseBody.content[0].text;
    } else if (responseBody.completion) {
      content = responseBody.completion;
    } else {
      console.error('Unexpected response format:', responseBody);
      throw new Error('Unexpected response format from Bedrock model');
    }
    
    console.log('Model response content:', content.substring(0, 200) + '...');
    
    // Try to parse the JSON response from the model
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysisResult = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed analysis result');
      
      return {
        positiveFeedback: analysisResult.positiveFeedback || [],
        negativeFeedback: analysisResult.negativeFeedback || [],
        success: true
      };
    } else {
      console.warn('No JSON found in model response, creating fallback');
      
      // Fallback: create structured feedback from raw text
      return {
        positiveFeedback: [
          "Your essay addresses the assigned topic clearly.",
          "You have presented arguments and attempted to support your position.",
          "The essay demonstrates engagement with the subject matter."
        ],
        negativeFeedback: [
          "Consider strengthening your argument structure and flow.",
          "Review grammar and sentence clarity throughout the essay.",
          "Add more specific examples and evidence to support your points.",
          `Additional feedback from AI: ${content.substring(0, 200)}...`
        ],
        success: true
      };
    }
  } catch (error) {
    console.error('Error analyzing essay with Bedrock:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Essay Analysis Request Started ===');
    
    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', success: false }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { essay } = requestData;

    // Validate essay input
    if (!essay || typeof essay !== 'string' || essay.trim().length === 0) {
      console.error('Invalid essay input');
      return new Response(
        JSON.stringify({ error: 'Essay text is required and cannot be empty', success: false }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Essay length: ${essay.length} characters`);

    // Get AWS credentials from environment variables (set in Supabase Dashboard)
    const region = Deno.env.get('AWS_REGION') || 'us-east-1';
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    console.log(`AWS Region: ${region}`);
    console.log(`AWS Access Key ID: ${accessKeyId ? 'Set (' + accessKeyId.substring(0, 8) + '...)' : 'Not set'}`);
    console.log(`AWS Secret Access Key: ${secretAccessKey ? 'Set (length: ' + secretAccessKey.length + ')' : 'Not set'}`);

    if (!accessKeyId || !secretAccessKey) {
      console.error('Missing AWS credentials in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Supabase Edge Function secrets.',
          details: `Access Key ID: ${accessKeyId ? 'Set' : 'Missing'}, Secret Access Key: ${secretAccessKey ? 'Set' : 'Missing'}`,
          success: false
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Starting Bedrock analysis...');
    
    // Call the Bedrock model with secure credentials
    const analysisResult = await analyzeEssayWithBedrock(essay, {
      accessKeyId,
      secretAccessKey,
      region
    });

    console.log('Analysis completed successfully');
    console.log(`Positive feedback items: ${analysisResult.positiveFeedback.length}`);
    console.log(`Negative feedback items: ${analysisResult.negativeFeedback.length}`);

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
    console.error('=== ERROR in analyze-essay function ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze essay. Please check your AWS Bedrock configuration and try again.',
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
