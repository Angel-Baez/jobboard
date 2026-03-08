import { inngest } from '../client';

/**
 * Cron: runs daily to expire stale job listings and
 * notify candidates with pending applications.
 */
export const jobExpired = inngest.createFunction(
  { id: 'job-expired', name: 'Expire Stale Jobs' },
  { cron: '0 0 * * *' }, // daily at midnight UTC
  async ({ step }) => {
    const expiredCount = await step.run('expire-stale-jobs', async () => {
      console.log('[cron] expiring stale jobs');
      // TODO: call JobsService.expireStaleJobs()
      return { expiredCount: 0 };
    });

    await step.run('notify-pending-applications', async () => {
      console.log(`[cron] notifying pending applications for ${expiredCount} expired jobs`);
      // TODO: find PENDING applications for expired jobs and notify candidates
      return { notified: true };
    });
  },
);
