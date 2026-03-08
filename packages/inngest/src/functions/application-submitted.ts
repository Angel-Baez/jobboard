import { inngest } from '../client';

/**
 * Triggered when a candidate submits an application.
 *
 * Fan-out:
 *  1. Email confirmation to candidate
 *  2. Email notification to employer
 *  3. Schedule auto-expire in 30 days if no response
 */
export const onApplicationSubmitted = inngest.createFunction(
  { id: 'application-submitted', name: 'Application Submitted' },
  { event: 'application/submitted' },
  async ({ event, step }) => {
    const { applicationId, candidateEmail, candidateName, jobTitle, companyName, employerEmail } =
      event.data;

    // Step 1: Confirm to candidate (runs in parallel with step 2)
    await step.run('email-candidate-confirmation', async () => {
      // EmailService will be called here — imported separately to avoid
      // circular dependency between Inngest functions and NestJS services
      console.log(`[email] confirmation → ${candidateEmail}`);
      // TODO: emailClient.sendTransacEmail({ to: candidateEmail, ... })
      return { sent: true };
    });

    // Step 2: Notify employer
    await step.run('email-employer-notification', async () => {
      console.log(`[email] new application → ${employerEmail}`);
      // TODO: emailClient.sendTransacEmail({ to: employerEmail, ... })
      return { sent: true };
    });

    // Step 3: Schedule auto-expire — runs 30 days from now
    await step.sleepUntil(
      'wait-for-employer-response',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );

    await step.run('auto-expire-if-no-response', async () => {
      console.log(`[expire] checking application #${applicationId}`);
      // TODO: call ApplicationsService.autoExpire(applicationId)
      // Only expires if still PENDING
      return { checked: true };
    });
  },
);
