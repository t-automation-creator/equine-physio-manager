import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { audioBlob } = await req.json();

    if (!audioBlob) {
      return Response.json({ error: 'No audio data provided' }, { status: 400 });
    }

    // Convert base64 to binary
    const audioBuffer = Uint8Array.from(atob(audioBlob), c => c.charCodeAt(0));

    // Create form data for OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    // Get OpenAI API key from environment
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

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
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return Response.json({ error: 'Transcription failed' }, { status: 500 });
    }

    const result = await response.json();

    return Response.json({ text: result.text });
  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
