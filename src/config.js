export const AUTH_URL = 'https://01kx8x9r368pa925xtce1vqvsy.hercules-auth.com';
export const AUTH_CLIENT_ID = 'ygdqjXtssZmrIccbkFxAklmZAPyAUYzu';
export const AUTH_CALLBACK_URL = 'https://automanagevm.app/auth/callback';

export const CONVEX_SITE_URL = 'https://rugged-lyrebird-259.convex.site';
export const RECEIPT_VERIFICATION_URL = `${CONVEX_SITE_URL}/apple-iap-verify`;
export const APPLE_S2S_NOTIFICATION_URL = `${CONVEX_SITE_URL}/apple-s2s-notifications`;

export function getAuthUrl(mode = 'login') {
  const params = new URLSearchParams({
    client_id: AUTH_CLIENT_ID,
    redirect_uri: AUTH_CALLBACK_URL,
    response_type: 'code',
    mode,
  });

  return `${AUTH_URL}?${params}`;
}
