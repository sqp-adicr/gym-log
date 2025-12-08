import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzpgzkakzyzuhljbhhdh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cGd6a2Frenl6dWhsamJoaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzYxNTMsImV4cCI6MjA4MDUxMjE1M30.yzVBFJyYP16V_1swIrTzZSi9yzBkSXqo8FucAmLSPFc';

export const supabase = createClient(supabaseUrl, supabaseKey);