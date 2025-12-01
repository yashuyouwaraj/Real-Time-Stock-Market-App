import { Inngest} from "inngest";

const geminiApiKey = process.env.GEMINI_API_KEY;

export const inngest = new Inngest({
    id: 'signalist',
    ...(geminiApiKey && {
        ai: { gemini: { apiKey: geminiApiKey }}
    })
})
