import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options) => {
      // Only proxy on the client side for PostgREST API routes
      // We skip /storage/v1/ and other routes to prevent breaking file uploads
      if (typeof window !== 'undefined' && url.toString().includes('/rest/v1/')) {
        let serializedHeaders: Record<string, string> = {};
        if (options && options.headers) {
          if (options.headers instanceof Headers) {
            options.headers.forEach((value, key) => {
              serializedHeaders[key] = value;
            });
          } else if (Array.isArray(options.headers)) {
            options.headers.forEach(([key, value]) => {
              serializedHeaders[key] = value;
            });
          } else {
            serializedHeaders = { ...options.headers } as Record<string, string>;
          }
        }
        
        const proxyOptions = {
          ...options,
          headers: serializedHeaders
        };

        const res = await fetch('/api/supabase-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.toString(), options: proxyOptions })
        });
        
        // Return a constructed Response object that supabase-js understands
        return new Response(await res.text(), {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers
        });
      }
      
      // Fallback for server-side or non-rest routes (like storage)
      return fetch(url, options);
    }
  }
})