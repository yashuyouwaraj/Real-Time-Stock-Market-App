import {inngest} from "@/lib/inngest/client";
import {DAILY_BRIEF_PROMPT, NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT} from "@/lib/inngest/prompts";
import {sendDailyBriefEmail, sendNewsSummaryEmail, sendWelcomeEmail} from "@/lib/nodemailer";
import {getAllUsersForNewsEmail} from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getMarketRegimeSnapshot, getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import { connectToDatabase } from "@/database/mongoose";
import { DailyBrief } from "@/database/models/daily-brief.model";

export const sendSignUpEmail = inngest.createFunction(
    { id: 'sign-up-email' },
    { event: 'app/user.created'},
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
            body: {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }]
            }
        })

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) ||'Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.'

            const { data: { email, name } } = event;

            return await sendWelcomeEmail({ email, name, intro: introText });
        })

        return {
            success: true,
            message: 'Welcome email sent successfully'
        }
    }
)

export const sendDailyNewsSummary = inngest.createFunction(
    { id: 'daily-news-summary' },
    [ { event: 'app/send.daily.news' }, { cron: '0 12 * * *' } ],
    async ({ step }) => {
        // Step #1: Get all users for news delivery
        const users = await step.run('get-all-users', getAllUsersForNewsEmail) as User[]

        if(!users || users.length === 0) return { success: false, message: 'No users found for news email' };

        // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
        const results = await step.run('fetch-user-news', async () => {
              const perUser: Array<{ user: User; articles: MarketNewsArticle[] }> = [];
              for (const user of users) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);
                    // Enforce max 6 articles per user
                    articles = (articles || []).slice(0, 6);
                    // If still empty, fallback to general
                    if (!articles || articles.length === 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error('daily-news: error preparing user news', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }
            return perUser;
        }) as Array<{ user: User; articles: MarketNewsArticle[] }>;

        // Step #3: (placeholder) Summarize news via AI
        const userNewsSummaries: { user: User; newsContent: string | null }[] = [];

        for (const { user, articles } of results) {
                try {
                    const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));

                    const response = await step.ai.infer(`summarize-news-${user.email}`, {
                        model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
                        body: {
                            contents: [{ role: 'user', parts: [{ text:prompt }]}]
                        }
                    });

                    const part = response.candidates?.[0]?.content?.parts?.[0];
                    const newsContent = (part && 'text' in part ? part.text : null) || 'No market news.'

                    userNewsSummaries.push({ user, newsContent });
                } catch {
                    console.error('Failed to summarize news for : ', user.email);
                    userNewsSummaries.push({ user, newsContent: null });
                }
            }

        // Step #4: (placeholder) Send the emails
        await step.run('send-news-emails', async () => {
                await Promise.all(
                    userNewsSummaries.map(async ({ user, newsContent}) => {
                        if(!newsContent) return false;

                        return await sendNewsSummaryEmail({ email: user.email, date: getFormattedTodayDate(), newsContent })
                    })
                )
            })

        return { success: true, message: 'Daily news summary emails sent successfully' }
    }
)

export const sendDailyAIBrief = inngest.createFunction(
    { id: "daily-ai-brief" },
    [{ event: "app/send.daily.brief" }, { cron: "0 11 * * *" }],
    async ({ step }) => {
        const users = (await step.run("get-all-users-for-brief", getAllUsersForNewsEmail)) as User[];
        if (!users || users.length === 0) {
            return { success: false, message: "No users found for daily brief" };
        }

        const regime = await step.run("get-market-regime", async () => getMarketRegimeSnapshot());
        const date = getFormattedTodayDate();
        const dateKey = new Date().toISOString().split("T")[0];

        await step.run("generate-and-send-briefs", async () => {
            await connectToDatabase();

            for (const user of users) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    const articles = (await getNews(symbols)).slice(0, 6);

                    const prompt = DAILY_BRIEF_PROMPT
                        .replace("{{date}}", date)
                        .replace("{{regime}}", JSON.stringify(regime))
                        .replace("{{symbols}}", JSON.stringify(symbols))
                        .replace("{{newsData}}", JSON.stringify(articles, null, 2));

                    const response = await step.ai.infer(`ai-brief-${user.email}`, {
                        model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
                        body: {
                            contents: [{ role: "user", parts: [{ text: prompt }] }],
                        },
                    });

                    const part = response.candidates?.[0]?.content?.parts?.[0];
                    const briefHtml =
                        (part && "text" in part ? part.text : null) ||
                        `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#CCDADC;">No major changes today. Keep risk controlled and focus on watchlist quality.</p>`;

                    const headline = `Morning setup for ${user.name} (${String(regime.regime).replace("_", " ")})`;

                    await DailyBrief.findOneAndUpdate(
                        { userId: user.id, dateKey },
                        {
                            $set: {
                                email: user.email,
                                headline,
                                briefHtml,
                                regime: regime.regime,
                            },
                        },
                        { upsert: true, new: true }
                    );

                    await sendDailyBriefEmail({ email: user.email, date, headline, briefHtml });
                } catch (error) {
                    console.error("daily-ai-brief error for", user.email, error);
                }
            }
        });

        return { success: true, message: "Daily AI briefs sent and stored" };
    }
);
