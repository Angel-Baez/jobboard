import { inngest } from '../client';

/**
 * Cron: runs daily to warn employers 3 days before job expires.
 */
export const jobExpiringSoon = inngest.createFunction(
  { id: 'job-expiring-soon', name: 'Job Expiring Soon Warning' },
  { cron: '0 9 * * *' }, // daily at 9am UTC
  async ({ step }) => {
    await step.run('find-and-warn-expiring-jobs', async () => {
      console.log('[cron] checking for jobs expiring in 3 days');
      // TODO: call JobsService.findExpiringJobs(3) and send warning emails
      return { checked: true };
    });
  },
);
