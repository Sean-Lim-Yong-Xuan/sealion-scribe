import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { BedrockRuntimeClient, InvokeModelCommand } from "https://esm.sh/@aws-sdk/client-bedrock-runtime@3.888.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Initialize Bedrock client with explicit configuration for Deno environment
    const bedrockClient = new BedrockRuntimeClient({
      region: Deno.env.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
      },
      // Prevent SDK from trying to load config files
      maxAttempts: 3,
      requestHandler: undefined, // Use default fetch-based handler
      // Disable file-based configuration loading
      disableHostPrefix: true,
    });

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

    // Create the command for Sealion model (adjust model ID as needed)
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
            content: analysisPrompt
          }
        ]
      })
    });

    console.log('Invoking Bedrock model for essay analysis...');
    
    // Invoke the model
    const response = await bedrockClient.send(command);
    
    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Bedrock response:', responseBody);

    let analysisResult;
    try {
      // Extract the content from Claude's response
      const content = responseBody.content[0].text;
      
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
      const content = responseBody.content[0].text;
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
