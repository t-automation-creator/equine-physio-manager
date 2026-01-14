import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);

      // Parse OpenAI error for specific messages
      try {
        const errorJson = JSON.parse(errorText);
        const errorMsg = errorJson.error?.message || 'Transcription failed';
        return Response.json({ error: errorMsg }, { status: response.status });
      } catch {
        return Response.json({ error: 'Transcription failed. Please try again.' }, { status: 500 });
      }
    }

    const result = await response.json();

    // Validate response has text
    if (!result.text) {
      return Response.json({ error: 'No transcription returned' }, { status: 500 });
    }

    return Response.json({ text: result.text });
  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json({ error: error.message || 'Unknown error occurred' }, { status: 500 });
  }
});