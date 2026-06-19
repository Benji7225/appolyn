import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Génère le texte "Nouveautés / What's New" d'une version, localisé par langue,
// à partir d'un court résumé des changements. Une vraie corvée pour un indie qui
// ship dans 10+ langues → on l'automatise. Clé Anthropic côté serveur uniquement.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-4-6';
const WHATS_NEW_LIMIT = 4000; // Apple

const Schema = z.object({ whats_new: z.string() });
type Fields = z.infer<typeof Schema>;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: { whats_new: { type: 'string' } },
  required: ['whats_new'],
  additionalProperties: false,
} as const;

type Target = { code: string; label: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const clamp = (v: string, max: number) => (v.length > max ? v.slice(0, max).trim() : v);

async function generateForLocale(client: Anthropic, appName: string, summary: string, target: Target): Promise<Fields> {
  const system =
    "You are an App Store release-notes expert. Given a short summary of what changed in a new app version, " +
    "write the 'What's New' text for a target App Store locale. Localize NATURALLY for that market (do not translate literally). " +
    "Keep it concise, benefit-focused and scannable: short lines or '• ' bullets are fine, but NO markdown headings, NO bold/asterisks. " +
    "Friendly and clear, no hype, no fake claims. Respect the Apple limit of 4000 characters. Return only the whats_new field.";

  const user =
    `Target locale: ${target.label} (${target.code})\n` +
    `App name: ${appName || '(unknown)'}\n\n` +
    `What changed in this version (author's notes, any language):\n${summary}\n\n` +
    `Write the What's New text for ${target.label}.`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    thinking: { type: 'disabled' },
    system,
    messages: [{ role: 'user', content: user }],
    output_config: {
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
      effort: 'low',
    },
  } as Anthropic.MessageCreateParamsNonStreaming);

  const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  if (!textBlock) throw new Error('No content returned');
  const parsed = Schema.parse(JSON.parse(textBlock.text));
  return { whats_new: clamp(parsed.whats_new, WHATS_NEW_LIMIT) };
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = { status: 'fulfilled', value: await fn(items[idx]) }; }
      catch (e) { results[idx] = { status: 'rejected', reason: e }; }
    }
  });
  await Promise.all(workers);
  return results;
}

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "L'IA n'est pas configurée sur le serveur." }, { status: 503 });

  let body: { summary?: string; appName?: string; targetLocales?: Target[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }); }

  const summary = (body.summary ?? '').trim();
  const targets = body.targetLocales ?? [];
  if (summary.length < 3) return NextResponse.json({ error: "Décris d'abord ce qui a changé dans cette version." }, { status: 400 });
  if (targets.length === 0) return NextResponse.json({ error: 'Aucune langue cible fournie.' }, { status: 400 });

  const client = new Anthropic({ apiKey });
  const settled = await pool(targets, 6, (t) => generateForLocale(client, body.appName ?? '', summary, t));

  const notes: Record<string, string> = {};
  const errors: Record<string, string> = {};
  settled.forEach((r, idx) => {
    const code = targets[idx].code;
    if (r.status === 'fulfilled') notes[code] = r.value.whats_new;
    else errors[code] = r.reason instanceof Error ? r.reason.message : 'Génération impossible';
  });

  return NextResponse.json({ notes, errors });
}
