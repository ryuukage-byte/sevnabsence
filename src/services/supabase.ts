import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://esiwgshifchloadscuoh.supabase.co';
// Publishable (client-side) key of the sevnabsence project; access is governed by RLS on app_records.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Os79gMCTl_e28oBJ5H9TJA_wXc4q0FM';

/** Cloud sync runs when a project is configured and not explicitly turned off (VITE_CLOUD_SYNC=false). */
export const SUPABASE_CONFIGURED = !!supabaseUrl && !!supabaseAnonKey && import.meta.env.VITE_CLOUD_SYNC !== 'false';
export const SUPABASE_PROJECT_REF = supabaseUrl.replace(/^https:\/\//, '').split('.')[0];

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
