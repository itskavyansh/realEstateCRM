const cron = require('node-cron');
const { FollowUp, User, Lead, Client, Activity } = require('../models');
const { sendFollowUpReminder } = require('./email.service');

/**
 * Start the follow-up reminder cron job.
 * Runs every minute, checks for due follow-ups, and sends reminder emails.
 */
const startFollowUpCron = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find follow-ups that are due, not completed, and haven't had email sent
      const dueFollowUps = await FollowUp.find({
        scheduledAt: { $lte: now },
        isCompleted: false,
        emailSent: false,
      }).populate('user', 'name email');

      if (dueFollowUps.length === 0) return;

      console.log(`[Cron] Processing ${dueFollowUps.length} due follow-up(s)...`);

      for (const followUp of dueFollowUps) {
        let contactName = 'Unknown Contact';

        if (followUp.lead) {
          const lead = await Lead.findById(followUp.lead);
          contactName = lead?.name || contactName;
        } else if (followUp.client) {
          const client = await Client.findById(followUp.client);
          contactName = client?.name || contactName;
        }

        // Send email
        const sent = await sendFollowUpReminder(
          followUp.user.email,
          followUp.user.name,
          contactName,
          followUp.note,
          followUp.scheduledAt
        );

        // Mark as email sent
        followUp.emailSent = true;
        await followUp.save();

        // Log activity
        await Activity.create({
          type: 'FOLLOW_UP_COMPLETED',
          description: `Follow-up reminder sent for ${contactName}`,
          entityType: followUp.lead ? 'LEAD' : 'CLIENT',
          entityId: followUp.lead || followUp.client,
          user: followUp.user._id,
          metadata: { emailSent: sent, followUpId: followUp._id },
        });
      }
    } catch (err) {
      console.error('[Cron] Follow-up check error:', err.message);
    }
  });

  console.log('[Cron] Follow-up reminder job started (runs every minute)');
};

module.exports = { startFollowUpCron };
