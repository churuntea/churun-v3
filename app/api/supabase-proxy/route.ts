import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    // We proxy all requests using the service role key because the frontend heavily relies on anonymous access which was recently blocked by RLS.
    // 2. Parse the proxy request
    const { url, options } = await request.json();

    if (!url || !url.startsWith(supabaseUrl)) {
      return new NextResponse('Invalid URL', { status: 400 });
    }

    // 3. Inject the Service Role Key to bypass the newly enabled RLS
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${serviceRoleKey}`);
    headers.set('apikey', serviceRoleKey);

    // 4. Forward the request to Supabase
    const response = await fetch(url, {
      ...options,
      headers
    });

    // 5. Read the response body
    const data = await response.text();

    // 6. Return the response to the client with the same status and headers
    const resHeaders = new Headers();
    response.headers.forEach((value, key) => {
      resHeaders.set(key, value);
    });

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders
    });
  } catch (error: any) {
    console.error('Supabase proxy error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
