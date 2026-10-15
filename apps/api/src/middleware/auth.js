import { supabaseAdmin } from '../utils/pocketbaseClient.js';

// Verifies the Supabase access token sent by the website (Authorization: Bearer <token>).
const getUser = async (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  return { ...data.user, role: profile?.role || 'user' };
};

export const requireUser = async (req, res, next) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Please log in' });
  req.user = user;
  next();
};

export const requireAdmin = async (req, res, next) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Please log in' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  req.user = user;
  next();
};
