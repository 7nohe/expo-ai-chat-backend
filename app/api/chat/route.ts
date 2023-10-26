// /api/chat

// ./app/api/chat/route.ts
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { NextResponse, userAgent } from 'next/server';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: Request, res: Response) {
  // Extract the `prompt` from the body of the request
  const { messages } = await req.json();
  const userAgentData = userAgent(req);
  // FIX: Seems not to work on Android
  const isNativeMobile = userAgentData.ua?.includes('Expo');

  if (!isNativeMobile) {
    console.log('Not native mobile');
    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages,
    });
    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);
    // Respond with the stream
    return new StreamingTextResponse(stream);
  } else {
    console.log('Native mobile');
    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      // Set your provider stream option to be `false` for native
      stream: false,
      messages,
    });

    return NextResponse.json({ data: response.choices[0].message });
  }
}
