import { inngest } from '../client';

/**
 * Triggered when employer changes application status.
 * Notifies the candidate of the update.
 */
export const onApplicationStatusChanged = inngest.createFunction(
  { id: 'application-status-changed', name: 'Application Status Changed' },
  { event: 'application/status-changed' },
  async ({ event, step }) => {
    const { candidateEmail, candidateName, jobTitle, companyName, newStatus } = event.data;

    await step.run('notify-candidate-status-change', async () => {
      const messages: Record<string, string> = {
        REVIEWING: `Your application for ${jobTitle} at ${companyName} is being reviewed.`,
        SHORTLISTED: `Great news! You've been shortlisted for ${jobTitle} at ${companyName}.`,
        REJECTED: `Thank you for applying to ${jobTitle} at ${companyName}. Unfortunately, you weren't selected.`,
        HIRED: `Congratulations! You've been hired for ${jobTitle} at ${companyName}.`,
      };

      const message = messages[newStatus];
      if (!message) return { skipped: true };

      console.log(`[email] status update → ${candidateEmail}: ${message}`);
      // TODO: emailClient.sendTransacEmail({ to: candidateEmail, ... })
      return { sent: true, status: newStatus };
    });
  },
);
