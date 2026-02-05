/**
 * Email Service
 *
 * Sends emails via Firebase Extension "Trigger Email from Firestore"
 * Emails are sent by writing documents to the 'mail' collection
 *
 * Setup required:
 * 1. Install Firebase Extension: "Trigger Email from Firestore"
 * 2. Configure with SendGrid API key in Firebase Console
 */

import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

// DoFO brand colors
const BRAND = {
  primary: '#0ea5e9',    // Sky blue
  dark: '#0f172a',       // Slate 900
  accent: '#f97316',     // Orange
  text: '#334155',       // Slate 700
  lightBg: '#f8fafc',    // Slate 50
};

/**
 * Base HTML email template with DoFO branding
 */
const getEmailTemplate = ({ title, preheader, bodyContent, buttonText, buttonUrl, footerText }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button { padding: 12px 24px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.lightBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preheader text (shows in email preview) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${preheader || ''}
  </div>

  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${BRAND.lightBg};">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Email container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <!-- Header with logo -->
          <tr>
            <td align="center" style="padding: 32px 40px 24px; background: linear-gradient(135deg, ${BRAND.dark} 0%, #1e293b 100%); border-radius: 12px 12px 0 0;">
              <img src="https://digitaldofo.com/DoFO%20-%20White%20logo%20transparent%20bckgrnd.png" alt="DoFO" width="360" style="display: block; max-width: 360px;" />
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; color: ${BRAND.dark}; font-size: 24px; font-weight: 700; line-height: 1.3;">
                ${title}
              </h1>

              <div style="color: ${BRAND.text}; font-size: 16px; line-height: 1.6;">
                ${bodyContent}
              </div>

              ${buttonText && buttonUrl ? `
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="background-color: ${BRAND.primary}; border-radius: 8px;">
                    <a href="${buttonUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${BRAND.lightBg}; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">
                ${footerText || 'DoFO - Digital Offensive Football Operations'}
              </p>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px; text-align: center;">
                <a href="https://digitaldofo.com" style="color: ${BRAND.primary}; text-decoration: none;">digitaldofo.com</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Send a school admin invite email
 */
export async function sendSchoolAdminInvite({
  toEmail,
  schoolName,
  inviterName = 'DoFO Team',
  trialDays = 7
}) {
  const signupUrl = 'https://digitaldofo.com';

  const html = getEmailTemplate({
    title: `You're Invited to Lead ${schoolName} on DoFO!`,
    preheader: `${inviterName} has invited you to manage ${schoolName}'s football program on DoFO.`,
    bodyContent: `
      <p style="margin: 0 0 16px;">
        <strong>${inviterName}</strong> has invited you to be the administrator for
        <strong>${schoolName}</strong> on DoFO - the digital platform for football coaches.
      </p>

      <p style="margin: 0 0 16px;">
        As the School Admin, you'll be able to:
      </p>

      <ul style="margin: 0 0 16px; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Build and manage your playbook</li>
        <li style="margin-bottom: 8px;">Create game plans and wristband cards</li>
        <li style="margin-bottom: 8px;">Plan practices and track installs</li>
        <li style="margin-bottom: 8px;">Invite coaches to your staff</li>
        <li style="margin-bottom: 8px;">Manage your team's roster and depth chart</li>
      </ul>

      <p style="margin: 0 0 16px;">
        Your <strong>${trialDays}-day free trial</strong> starts when you sign up. No credit card required.
      </p>

      <p style="margin: 0; padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <strong>Important:</strong> Sign up using this email address (<strong>${toEmail}</strong>) to automatically get admin access to ${schoolName}.
      </p>
    `,
    buttonText: 'Get Started',
    buttonUrl: signupUrl,
    footerText: `You received this email because you were invited to join ${schoolName} on DoFO.`
  });

  // Write to Firestore 'mail' collection - Firebase Extension picks this up
  const mailDoc = {
    to: toEmail,
    message: {
      subject: `You're Invited: Manage ${schoolName} on DoFO`,
      html: html,
    },
    createdAt: new Date().toISOString(),
    type: 'school_admin_invite',
    metadata: {
      schoolName,
      inviterName,
      trialDays
    }
  };

  try {
    const docRef = await addDoc(collection(db, 'mail'), mailDoc);
    console.log('Invite email queued:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Failed to queue invite email:', error);
    throw error;
  }
}

/**
 * Send a coach invite email (for existing schools)
 */
export async function sendCoachInvite({
  toEmail,
  schoolName,
  inviterName,
  role = 'Coach'
}) {
  const signupUrl = 'https://digitaldofo.com';

  const html = getEmailTemplate({
    title: `Join ${schoolName}'s Coaching Staff on DoFO`,
    preheader: `${inviterName} has invited you to join the ${schoolName} coaching staff.`,
    bodyContent: `
      <p style="margin: 0 0 16px;">
        <strong>${inviterName}</strong> has invited you to join the
        <strong>${schoolName}</strong> coaching staff on DoFO as a <strong>${role}</strong>.
      </p>

      <p style="margin: 0 0 16px;">
        DoFO is the digital platform for football coaches to:
      </p>

      <ul style="margin: 0 0 16px; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Access the team playbook</li>
        <li style="margin-bottom: 8px;">View game plans and practice schedules</li>
        <li style="margin-bottom: 8px;">Collaborate with your coaching staff</li>
      </ul>

      <p style="margin: 0; padding: 16px; background-color: #dbeafe; border-radius: 8px; border-left: 4px solid #3b82f6;">
        Sign up using this email address (<strong>${toEmail}</strong>) to automatically join ${schoolName}.
      </p>
    `,
    buttonText: 'Join Your Team',
    buttonUrl: signupUrl,
    footerText: `You received this email because ${inviterName} invited you to join ${schoolName} on DoFO.`
  });

  const mailDoc = {
    to: toEmail,
    message: {
      subject: `Join ${schoolName} on DoFO`,
      html: html,
    },
    createdAt: new Date().toISOString(),
    type: 'coach_invite',
    metadata: {
      schoolName,
      inviterName,
      role
    }
  };

  try {
    const docRef = await addDoc(collection(db, 'mail'), mailDoc);
    console.log('Coach invite email queued:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Failed to queue coach invite email:', error);
    throw error;
  }
}

/**
 * Send a trial extension notification email
 */
export async function sendTrialExtensionEmail({
  toEmail,
  schoolName,
  newTrialEndDate,
  daysExtended
}) {
  const html = getEmailTemplate({
    title: 'Your DoFO Trial Has Been Extended!',
    preheader: `Great news! Your trial for ${schoolName} has been extended.`,
    bodyContent: `
      <p style="margin: 0 0 16px;">
        Great news! Your free trial for <strong>${schoolName}</strong> has been extended by
        <strong>${daysExtended} days</strong>.
      </p>

      <p style="margin: 0 0 16px;">
        Your new trial end date is: <strong>${new Date(newTrialEndDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</strong>
      </p>

      <p style="margin: 0 0 16px;">
        Keep building your playbook, creating game plans, and preparing to win the week!
      </p>
    `,
    buttonText: 'Continue to DoFO',
    buttonUrl: 'https://digitaldofo.com',
    footerText: `This email was sent regarding your ${schoolName} account on DoFO.`
  });

  const mailDoc = {
    to: toEmail,
    message: {
      subject: 'Your DoFO Trial Has Been Extended!',
      html: html,
    },
    createdAt: new Date().toISOString(),
    type: 'trial_extension',
    metadata: {
      schoolName,
      newTrialEndDate,
      daysExtended
    }
  };

  try {
    const docRef = await addDoc(collection(db, 'mail'), mailDoc);
    console.log('Trial extension email queued:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Failed to queue trial extension email:', error);
    throw error;
  }
}

export default {
  sendSchoolAdminInvite,
  sendCoachInvite,
  sendTrialExtensionEmail
};
