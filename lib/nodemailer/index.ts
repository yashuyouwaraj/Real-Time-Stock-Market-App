import nodemailer from "nodemailer";
import {
  DAILY_BRIEF_EMAIL_TEMPLATE,
  NEWS_SUMMARY_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";
import { buildEmailPreferencesUrl, buildUnsubscribeUrl } from "@/lib/unsubscribe";
import { isEmailSubscribed } from "@/lib/subscription";

function getComplianceHeaders(unsubscribeUrl: string) {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL!,
    pass: process.env.NODEMAILER_PASSWORD!,
  },
});

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const preferencesUrl = buildEmailPreferencesUrl(email);
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE
    .replace("{{name}}", name)
    .replace("{{intro}}", intro)
    .replaceAll("{{unsubscribeUrl}}", unsubscribeUrl)
    .replaceAll("{{preferencesUrl}}", preferencesUrl);

  const mailOptions = {
    from: '"Signalist" <signalist@stock.app>',
    to: email,
    subject: "Welcome to Signalist - your stock market toolkit is ready!",
    text: "Thanks for joining Signalist",
    html: htmlTemplate,
    headers: getComplianceHeaders(unsubscribeUrl),
  };

  await transporter.sendMail(mailOptions);
};

export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
}: {
  email: string;
  date: string;
  newsContent: string;
}): Promise<void> => {
  const subscribed = await isEmailSubscribed(email);
  if (!subscribed) return;

  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const preferencesUrl = buildEmailPreferencesUrl(email);
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
    .replace("{{date}}", date)
    .replace("{{newsContent}}", newsContent)
    .replaceAll("{{unsubscribeUrl}}", unsubscribeUrl)
    .replaceAll("{{preferencesUrl}}", preferencesUrl);

  const mailOptions = {
    from: '"Signalist News" <signalist@stock.app>',
    to: email,
    subject: `Market News Summary Today - ${date}`,
    text: "Today's market news summary from Signalist",
    html: htmlTemplate,
    headers: getComplianceHeaders(unsubscribeUrl),
  };

  await transporter.sendMail(mailOptions);
};

export const sendDailyBriefEmail = async ({
  email,
  date,
  headline,
  briefHtml,
}: {
  email: string;
  date: string;
  headline: string;
  briefHtml: string;
}): Promise<void> => {
  const subscribed = await isEmailSubscribed(email);
  if (!subscribed) return;

  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const preferencesUrl = buildEmailPreferencesUrl(email);
  const dashboardUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const htmlTemplate = DAILY_BRIEF_EMAIL_TEMPLATE
    .replace("{{date}}", date)
    .replace("{{headline}}", headline)
    .replace("{{briefHtml}}", briefHtml)
    .replaceAll("{{unsubscribeUrl}}", unsubscribeUrl)
    .replaceAll("{{preferencesUrl}}", preferencesUrl)
    .replaceAll("{{dashboardUrl}}", dashboardUrl);

  const mailOptions = {
    from: '"Signalist Brief" <signalist@stock.app>',
    to: email,
    subject: `Daily Brief - ${date}`,
    text: `${headline}\n\nOpen dashboard for full brief.`,
    html: htmlTemplate,
    headers: getComplianceHeaders(unsubscribeUrl),
  };

  await transporter.sendMail(mailOptions);
};
