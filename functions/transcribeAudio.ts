import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { retryWithExponentialBackoff } from './utils/retryWithBackoff.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { audioBlob, mimeType = 'audio/webm' } = await req.json();

    if (!audioBlob) {
      return Response.json({ error: 'No audio data provided' }, { status: 400 });
    }

    // Convert base64 to binary
    const audioBuffer = Uint8Array.from(atob(audioBlob), c => c.charCodeAt(0));

    // Determine file extension from MIME type
    const fileExt = mimeType.includes('mp4') ? 'mp4'
      : mimeType.includes('ogg') ? 'ogg'
      : 'webm';

    // Create form data for OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: mimeType }), `audio.${fileExt}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    // Get OpenAI API key from environment
    const openaiKey = Deno.env.get('OpenAPIwhisper');

    if (!openaiKey) {
      return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Call OpenAI Whisper API with retry logic
    console.log(`[Transcribe] Starting transcription for user: ${user.email}, format: ${mimeType}`);

    const response = await retryWithExponentialBackoff(
      async () => {
        const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: formData,
        });

        // Check if response should trigger retry
        if (!res.ok) {
          const errorText = await res.text();

          // Parse error message
          let errorMsg = 'Transcription failed';
          try {
            const errorJson = JSON.parse(errorText);
            errorMsg = errorJson.error?.message || errorMsg;
          } catch {
            // Use default message if parsing fails
          }

          // For retryable errors (429, 500, 503), throw to trigger retry
          if ([429, 500, 503, 502].includes(res.status)) {
            const error = new Error(errorMsg) as any;
            error.status = res.status;
            throw error;
          }

          // For non-retryable errors (401, 400), return error response immediately
          if (res.status === 401) {
            throw new Error(`Authentication failed: ${errorMsg}`);
          }

          // Generic error
          const error = new Error(errorMsg) as any;
          error.status = res.status;
          throw error;
        }

        return res;
      },
      {
        maxRetries: 5,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        retryableStatuses: [429, 500, 503, 502]
      }
    );

    const result = await response.json();

    // Validate response has text
    if (!result.text) {
      console.error('[Transcribe] No text in response');
      return Response.json({ error: 'No transcription returned' }, { status: 500 });
    }

    console.log(`[Transcribe] Success! Transcribed ${result.text.length} characters`);
    return Response.json({ text: result.text });
  } catch (error: any) {
    console.error('[Transcribe] Final error after retries:', error);

    // Return specific error messages based on error type
    if (error.status === 429) {
      return Response.json({
        error: 'Rate limit exceeded after 5 retry attempts. Please wait 1 minute and try again.',
        retryAfter: 60,
        attemptsMade: 6
      }, { status: 429 });
    } else if (error.status === 401) {
      return Response.json({
        error: 'OpenAI API authentication failed. Please check the API key configuration.',
      }, { status: 401 });
    } else {
      return Response.json({
        error: error.message || 'Transcription failed after multiple attempts',
      }, { status: error.status || 500 });
    }
  }
});