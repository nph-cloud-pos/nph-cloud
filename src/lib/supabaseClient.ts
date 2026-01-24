
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tnmccwdsajcpknettjuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubWNjd2RzYWpjcGtuZXR0anV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzA1OTQsImV4cCI6MjA4NDgwNjU5NH0.4q4jsVLNkoe6HLfNq3gOgV6RVtGXCyVIdXAIB8LfMPc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
