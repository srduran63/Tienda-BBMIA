import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://xedmebojjonvkjnezpfn.supabase.co';
const supabaseKey = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZG1lYm9qam9udmtqbmV6cGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NzgyNjIsImV4cCI6MjA3ODM1NDI2Mn0.YHT-JxH0BZ1Fzhgl3JLa-tRxPvyPnR0--vvZ9zX-Uic';
export const supabase = createClient(supabaseUrl, supabaseKey);
export const fetchProducts = async() => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    return data;
};
export const fetchProfile = async(userId) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
};