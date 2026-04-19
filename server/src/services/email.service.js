const nodemailer = require('nodemailer');
const { CompanySettings } = require('../models');

/**
 * Get SMTP configuration — tries DB settings first, falls back to .env.
 */
const getTransporter = async () => {
  let config = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  try {
    const settings = await CompanySettings.findOne();
    if (settings && settings.smtpHost && settings.smtpUser) {
      config = {
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass,
        },
      };
    }
  } catch (err) {
    // Fall through to env config
  }

  return nodemailer.createTransport(config);
};

/**
 * Send a follow-up reminder email.
 */
const sendFollowUpReminder = async (toEmail, agentName, leadOrClientName, note, scheduledAt) => {
  try {
    const transporter = await getTransporter();
    const settings = await CompanySettings.findOne();
    const companyName = settings?.companyName || 'Real Estate CRM';

    await transporter.sendMail({
      from: `"${companyName}" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Follow-up Reminder: ${leadOrClientName}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; padding: 24px; background: #f8fafc; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">Follow-up Reminder</h2>
          <p style="color: #475569;">Hi ${agentName},</p>
          <p style="color: #475569;">You have a follow-up scheduled for <strong>${new Date(scheduledAt).toLocaleString()}</strong> with:</p>
          <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2563eb;">
            <p style="color: #0f172a; font-weight: 600; margin: 0 0 8px 0;">${leadOrClientName}</p>
            <p style="color: #64748b; margin: 0;">${note || 'No additional notes.'}</p>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">— ${companyName}</p>
        </div>
      `,
    });
    console.log(`[Email] Follow-up reminder sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send follow-up reminder:', err.message);
    return false;
  }
};

/**
 * Send a generic notification email.
 */
const sendNotification = async (toEmail, subject, htmlBody) => {
  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: `"Real Estate CRM" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject,
      html: htmlBody,
    });
    return true;
  } catch (err) {
    console.error('[Email] Failed to send notification:', err.message);
    return false;
  }
};

module.exports = { sendFollowUpReminder, sendNotification };
