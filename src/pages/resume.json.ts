// RES-05 — strict JSON Resume output from the same source.
import type { APIRoute } from 'astro';
import { flattenedResume } from '@/lib/resume';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(flattenedResume(), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
