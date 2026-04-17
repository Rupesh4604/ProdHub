import { GEMINI_MODEL } from '../config/env';

export const callGeminiWithRetry = async (payload, apiKey, maxRetries = 6) => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                return await response.json();
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
            if (error.message.includes("Rate limit") || error.message.includes("Service unavailable")) {
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
