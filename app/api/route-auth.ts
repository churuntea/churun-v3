import { NextResponse } from 'next/server';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

function getHeaderKey(request: Request): string | null {
  return (
    request.headers.get('x-admin-key')?.trim() ||
    request.headers.get('x-api-key')?.trim() ||
    request.headers.get('x-cron-secret')?.trim() ||
    null
  );
}

function getRequestSecret(request: Request): string | null {
  return getHeaderKey(request) || getBearerToken(request) || new URL(request.url).searchParams.get('secret');
}

export function enforceAdminApiKey(request: Request) {
  const token = getBearerToken(request) || getHeaderKey(request);
  if (!ADMIN_API_KEY || token !== ADMIN_API_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function enforceCronSecret(request: Request) {
  const token = getRequestSecret(request);
  if (!CRON_SECRET || token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
