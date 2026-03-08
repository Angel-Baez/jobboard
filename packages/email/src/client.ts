import * as Brevo from "@getbrevo/brevo";

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

export const emailClient = apiInstance;

export const DEFAULT_SENDER = {
  email: process.env.BREVO_SENDER_EMAIL ?? "noreply@jobboard.dev",
  name: process.env.BREVO_SENDER_NAME ?? "JobBoard",
};
