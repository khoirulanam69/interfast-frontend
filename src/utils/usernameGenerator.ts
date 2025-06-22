import { supabase } from '@/integrations/supabase/client';

export const generateUniqueUsernameDial = async (namaPanggilan: string, address: string, existingUsers: any[] = []): Promise<string> => {
  const cleanNamaPanggilan = namaPanggilan.replace(/\s+/g, '').toLowerCase();
  const cleanAddress = address.replace(/\s+/g, '').toLowerCase();
  
  // Get all existing username_dial from database
  const { data: users } = await supabase
    .from('users')
    .select('username_dial');
    
  const allUsernames = [
    ...(users?.map(u => u.username_dial) || []),
    ...existingUsers.map(u => u.username_dial)
  ];
  
  let counter = 1;
  let baseUsername = `${cleanNamaPanggilan}_${cleanAddress}`;
  let username = counter === 1 ? baseUsername : `${baseUsername}_${counter}`;
  
  // Keep incrementing counter until we find a unique username
  while (allUsernames.includes(username)) {
    counter++;
    username = `${baseUsername}_${counter}`;
  }
  
  return username;
};
