const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure your email transport
// Option 1: Gmail (requires "Less secure app access" or App Password)
// Option 2: SendGrid, Mailgun, or other SMTP service

// For Gmail with App Password:
// 1. Enable 2FA on your Google account
// 2. Go to Google Account > Security > App passwords
// 3. Generate an app password for "Mail"
// 4. Set these in Firebase Functions config:
//    firebase functions:config:set email.user="your-email@gmail.com" email.pass="your-app-password"

const getTransporter = () => {
    const emailConfig = functions.config().email || {};

    if (!emailConfig.user || !emailConfig.pass) {
        console.warn('Email not configured. Set with: firebase functions:config:set email.user="..." email.pass="..."');
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailConfig.user,
            pass: emailConfig.pass
        }
    });
};

// Admin emails to notify
const ADMIN_EMAILS = ['matthewfinn14@gmail.com', 'admin@digitaldofo.com'];

// Trigger when a new access request is created
exports.onNewAccessRequest = functions.firestore
    .document('access_requests/{email}')
    .onCreate(async (snap, context) => {
        const request = snap.data();
        const requestEmail = context.params.email;

        console.log('New access request from:', requestEmail);

        const transporter = getTransporter();
        if (!transporter) {
            console.log('Email not configured, skipping notification');
            return null;
        }

        const mailOptions = {
            from: `DoFO <${functions.config().email.user}>`,
            to: ADMIN_EMAILS.join(', '),
            subject: `[DoFO] New Access Request: ${request.name || requestEmail}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #38bdf8; margin: 0; font-size: 24px;">New Access Request</h1>
                    </div>
                    <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0 0 15px; color: #334155;">A new coach has requested access to DoFO:</p>

                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; width: 120px;">Name:</td>
                                <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${request.name || 'Not provided'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Email:</td>
                                <td style="padding: 8px 0; color: #0f172a;">${requestEmail}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">School:</td>
                                <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${request.schoolName || 'Not provided'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Role:</td>
                                <td style="padding: 8px 0; color: #0f172a;">${request.role || 'Not provided'}</td>
                            </tr>
                            ${request.phone ? `
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Phone:</td>
                                <td style="padding: 8px 0; color: #0f172a;">${request.phone}</td>
                            </tr>
                            ` : ''}
                            ${request.howHeard ? `
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">How they heard:</td>
                                <td style="padding: 8px 0; color: #0f172a;">${request.howHeard}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Submitted:</td>
                                <td style="padding: 8px 0; color: #0f172a;">${new Date(request.submittedAt).toLocaleString()}</td>
                            </tr>
                        </table>

                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                            <a href="https://digitaldofo.com"
                               style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Review in DoFO
                            </a>
                            <p style="margin: 15px 0 0; color: #64748b; font-size: 14px;">
                                Go to Settings → Access Requests to approve or reject this request.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Notification email sent to admins');
            return { success: true };
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    });

// Optional: Notify user when their request is approved
exports.onAccessRequestApproved = functions.firestore
    .document('access_requests/{email}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const userEmail = context.params.email;

        // Only send if status changed to 'approved'
        if (before.status === 'approved' || after.status !== 'approved') {
            return null;
        }

        console.log('Access request approved for:', userEmail);

        const transporter = getTransporter();
        if (!transporter) {
            console.log('Email not configured, skipping notification');
            return null;
        }

        const trialDays = after.trialDays || 7;
        const expiresAt = after.accessExpiresAt ? new Date(after.accessExpiresAt).toLocaleDateString() : 'N/A';

        const mailOptions = {
            from: `DoFO <${functions.config().email.user}>`,
            to: userEmail,
            subject: `Welcome to DoFO! Your access has been approved`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #10b981; margin: 0; font-size: 24px;">You're In! 🎉</h1>
                    </div>
                    <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0 0 15px; color: #334155; font-size: 16px;">
                            Great news! Your DoFO access request has been approved.
                        </p>

                        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #065f46; font-weight: bold;">
                                Your ${trialDays}-day free trial is now active!
                            </p>
                            <p style="margin: 10px 0 0; color: #047857; font-size: 14px;">
                                Trial expires: ${expiresAt}
                            </p>
                        </div>

                        <p style="color: #334155;">Here's what you can do next:</p>
                        <ol style="color: #334155; padding-left: 20px;">
                            <li style="margin-bottom: 10px;">Log in to <a href="https://digitaldofo.com" style="color: #0ea5e9;">digitaldofo.com</a></li>
                            <li style="margin-bottom: 10px;">Set up your team profile</li>
                            <li style="margin-bottom: 10px;">Add your roster and start planning!</li>
                        </ol>

                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                            <a href="https://digitaldofo.com"
                               style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Get Started
                            </a>
                        </div>

                        <p style="margin: 20px 0 0; color: #64748b; font-size: 14px;">
                            Questions? Reply to this email and we'll help you out.
                        </p>
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Approval email sent to user:', userEmail);
            return { success: true };
        } catch (error) {
            console.error('Error sending approval email:', error);
            return { success: false, error: error.message };
        }
    });
