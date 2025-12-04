import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const getRedirectUri = (req: VercelRequest) => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/auth/callback/google`;
  }
  // For local dev, use the host from the request
  const host = req.headers.host || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/api/auth/callback/google`;
};

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  const redirectUri = getRedirectUri(req);

  // Debug: Log the client ID being used
  console.log('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);
  console.log('Redirect URI:', redirectUri);

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      error: 'GOOGLE_CLIENT_ID not configured',
      hint: 'Check your .env.local file'
    });
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  res.redirect(authUrl.toString());
}
