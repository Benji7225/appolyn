import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Drafts a developer reply to an App Store review with Claude. Runs server-side
// so the Anthropic key is never exposed. Requires a valid Supabase session.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MODEL = 'claude-sonnet-4-6';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI is not configured yet. An Anthropic API key needs to be set on the server.' },
      { status: 503 },
    );
  }

  let body: {
    appName?: string;
    rating?: number;
    title?: string;
    review?: string;
    territory?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.review?.trim()) {
    return NextResponse.json({ error: 'No review text provided.' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const system =
    'You are the developer of an indie iOS app, writing a public reply to an App Store review. ' +
    'Write a short, warm, human reply (2-4 sentences). Thank the user, address their specific point, ' +
    'and if the rating is low, acknowledge the issue and invite them to share more (without sounding ' +
    'defensive or corporate). Match the language of the review. No emojis unless the review uses them. ' +
    'Plain text only, ready to post. Do not invent features or promises you cannot keep.';

  const user_msg =
    `App: ${body.appName ?? 'our app'}\n` +
    `Rating: ${body.rating ?? '?'}/5\n` +
    (body.territory ? `Store region: ${body.territory}\n` : '') +
    (body.title ? `Review title: ${body.title}\n` : '') +
    `Review: ${body.review}\n\n` +
    'Write the reply.';

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      thinking: { type: 'disabled' },
      system,
      messages: [{ role: 'user', content: user_msg }],
    });
    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    const reply = textBlock?.text?.trim() ?? '';
    if (!reply) return NextResponse.json({ error: 'Empty draft.' }, { status: 502 });
    return NextResponse.json({ reply });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Draft failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
