import { GEMINI_MODEL, GEMINI_API_KEY, GEMINI_PROXY_URL } from '../config/env';
import { auth } from '../config/firebase';

/**
 * Build the request target. In production we POST to the Cloudflare Worker proxy
 * (gemini-proxy/) with the user's Firebase ID token in the Authorization header;
 * the proxy holds the Gemini key as a secret. In local dev — when no proxy URL is
 * configured — we fall back to calling Gemini directly with a key from .env.local.
 */
const buildRequest = async () => {
    if (GEMINI_PROXY_URL) {
        let token = '';
        try {
            token = (await auth?.currentUser?.getIdToken?.()) || '';
        } catch (e) {
            console.warn('Could not get Firebase ID token for Gemini proxy:', e);
        }
        return {
            url: GEMINI_PROXY_URL,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        };
    }
    // Dev-only fallback (key lives in the bundle — do not use in production).
    return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        headers: { 'Content-Type': 'application/json' },
    };
};

export const callGeminiWithRetry = async (payload, maxRetries = 6) => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const { url, headers } = await buildRequest();
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                return await response.json();
            }

            if (response.status === 401 || response.status === 403) {
                throw new Error('You are not authorized to use the AI features. Please sign in again.');
            }

            if (response.status === 429 || response.status === 503) {
                retries++;
                if (retries >= maxRetries) {
                    throw new Error(response.status === 429 ? "Rate limit exceeded. Please try again later." : "Service unavailable (503). High demand, please try again later.");
                }
                const waitTime = Math.pow(2, retries) * 1000 + Math.random() * 1000;
                console.warn(`Gemini API ${response.status}: Retrying in ${Math.round(waitTime)}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        } catch (error) {
            if (error.message.includes("Rate limit") || error.message.includes("Service unavailable") || error.message.includes("not authorized")) {
                throw error;
            }
            if (error.name === 'TypeError') {
                retries++;
                if (retries >= maxRetries) {
                    throw new Error(`Network error: Failed after ${maxRetries} attempts`);
                }
                const waitTime = Math.pow(2, retries) * 1000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            throw error;
        }
    }
    throw new Error(`Failed to generate content after ${maxRetries} attempts`);
};
