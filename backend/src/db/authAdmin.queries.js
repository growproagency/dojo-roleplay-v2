import { supabase } from './supabase.js';

export async function generateRecoveryLink(email, redirectTo) {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  });
  if (error) throw error;
  return {
    actionLink: data.properties.action_link,
    redirectTo: data.properties.redirect_to,
    verificationType: data.properties.verification_type,
    userEmail: data.user?.email ?? email,
  };
}
