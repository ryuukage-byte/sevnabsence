import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tgnqtexegvcpagphqurb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbnF0ZXhlZ3ZjcGFncGhxdXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NTQyOTMsImV4cCI6MjEwNjMzMDI5M30.fsP8ZvOk5cmuH5XcdDzZo_Vanl0dNim7q1FUZY0Bb0c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { error } = await supabase.from('organizations').select('count', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet (SQL migration needs to be run in Supabase SQL editor)
        return {
          connected: true,
          message: 'Supabase terhubung! (Tabel database belum dibuat, silakan jalankan SQL migration).'
        };
      }
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Supabase terhubung dan siap digunakan.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown connection error';
    return { connected: false, message: errorMsg };
  }
}
