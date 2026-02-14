/**
 * Cliente Supabase compartido para Cloudflare Workers
 */

import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(env) {
    const supabaseUrl = env?.SUPABASE_URL;
    const supabaseKey = env?.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return null;
    }

    // Validar que la URL sea válida
    const trimmedUrl = String(supabaseUrl).trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        throw new Error(`Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL. Received: "${trimmedUrl.substring(0, 50)}..."`);
    }

    try {
        return createClient(trimmedUrl, String(supabaseKey).trim());
    } catch (error) {
        throw new Error(`Error creating Supabase client: ${error.message}`);
    }
}
