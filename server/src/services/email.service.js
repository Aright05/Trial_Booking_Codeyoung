import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { SCHEDULING_CONFIG } from '../config/constants.js';
import { query } from '../config/postgres.js';
import {
  formatLocalizedInterval,
  getTimezoneMetadata,
} from '../utils/timezone.js';

// Cache active transporter or ethereal test transporter
let activeTransporter = null;
let testOverrideTransporter = null;

/**
 * Configure or override transporter for tests
 */
export const setTestTransporter = (transporter) => {
  testOverrideTransporter = transporter;
};

/**
 * Reset test transporter override
 */
export const resetTestTransporter = () => {
  testOverrideTransporter = null;
};

/**
 * Initialize or return cached Nodemailer transporter
 */
export const getTransporter = async () => {
  if (testOverrideTransporter) {
    return testOverrideTransporter;
  }

  if (activeTransporter) {
    return activeTransporter;
  }

  // 1. In test environment, use a deterministic JSON/Stream transporter unless overridden
  if (config.nodeEnv === 'test') {
    activeTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return activeTransporter;
  }

  // 2. If SMTP credentials are configured via environment
  if (config.email.user && config.email.pass) {
    activeTransporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
    return activeTransporter;
  }

  // 3. In development without explicit credentials, try to create an Ethereal test sandbox
  try {
    const testAccount = await nodemailer.createTestAccount();
    activeTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[Email Service] Created sandbox Ethereal Email account for local testing.');
    return activeTransporter;
  } catch (err) {
    console.warn('[Email Service] Could not reach Ethereal sandbox, falling back to local JSON transport:', err.message);
    activeTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return activeTransporter;
  }
};

/**
 * Format email date and time cleanly
 */
const formatDateTimeForEmail = (startUtc, endUtc, timezone) => {
  const meta = getTimezoneMetadata(startUtc, timezone);
  const intervalStr = formatLocalizedInterval(startUtc, endUtc, timezone);
  return {
    intervalStr,
    timezoneDisplay: `${meta.timezone} (${meta.abbreviation}, ${meta.offsetString})`,
    abbreviation: meta.abbreviation,
    dateStr: meta.formattedDate,
    timeStr: meta.formattedTime,
  };
};

/**
 * Build Parent Confirmation Email Template
 */
export const buildParentEmail = ({
  parentName,
  bookingReference,
  mentorName,
  mentorEmail,
  startAt,
  endAt,
  parentTimezone,
  mentorTimezone = SCHEDULING_CONFIG.MENTOR_TIMEZONE,
  demoClassLink,
  durationMinutes = SCHEDULING_CONFIG.CLASS_DURATION_MINUTES,
}) => {
  const parentTimeInfo = formatDateTimeForEmail(startAt, endAt, parentTimezone);
  const mentorTimeInfo = formatDateTimeForEmail(startAt, endAt, mentorTimezone);

  const subject = `Confirmed: Codeyoung 1:1 Trial Class with ${mentorName} [Ref: ${bookingReference}]`;

  const text = `
Dear ${parentName},

Thank you for scheduling a 1:1 Free Trial Class with Codeyoung!

Your trial class has been successfully booked and confirmed. Here are your class details:

- Booking Reference: ${bookingReference}
- Assigned Mentor: ${mentorName} (${mentorEmail || 'Academic Operations'})
- Your Local Date & Time: ${parentTimeInfo.intervalStr} (${parentTimeInfo.timezoneDisplay})
- Mentor Local Time (India): ${mentorTimeInfo.intervalStr}
- Duration: ${durationMinutes} Minutes
- 1:1 Demo Class Meeting Link: ${demoClassLink}

Free Trial Policy Note:
- Each parent can use exactly one free trial per normalized Gmail account (including dot and alias variations).
- This free trial entitlement is preserved for your account even if cancelled or rescheduled.

Preparation:
- This is your dedicated demonstration classroom link.
- We recommend joining 5 minutes prior to the session to test your audio/video settings.
- A modern desktop/laptop browser (Chrome, Edge, Firefox, or Safari) is recommended.

Need Assistance?
- If you have any questions or need to cancel/reschedule, please reply to this email quoting your booking reference (${bookingReference}).

Warm regards,
The Codeyoung Academic Team
https://www.codeyoung.com
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #059669, #0d9488, #4338ca); color: #ffffff; padding: 32px 28px; text-align: left; }
    .header h1 { margin: 0 0 8px 0; font-size: 22px; font-weight: 800; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .body-content { padding: 28px; }
    .card { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #64748b; font-weight: 600; }
    .card-val { color: #0f172a; font-weight: 700; text-align: right; }
    .highlight-time { color: #4338ca; background: #e0e7ff; padding: 2px 8px; border-radius: 6px; font-weight: 800; }
    .btn-link { display: block; background: #059669; color: #ffffff !important; text-decoration: none; text-align: center; padding: 14px 20px; border-radius: 10px; font-weight: 700; font-size: 14px; margin: 24px 0 12px 0; }
    .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5; }
    .notice { font-size: 12px; color: #64748b; background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 3px solid #0d9488; margin-top: 16px; }
    .policy-box { font-size: 11px; color: #475569; background: #f1f5f9; border-radius: 8px; padding: 10px; margin-top: 12px; border: 1px dashed #cbd5e1; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Trial Class Confirmed</div>
      <h1>1:1 Trial Class Booking</h1>
      <p>Hello ${parentName}, your child's session with ${mentorName} is reserved.</p>
    </div>
    <div class="body-content">
      <p>We are delighted to welcome you to Codeyoung. Your 1:1 trial session has been reserved and your mentor is prepared for an engaging hands-on learning experience.</p>
      
      <div class="card">
        <div class="card-row">
          <span class="card-label">Booking Reference:</span>
          <span class="card-val" style="font-family: monospace; font-size: 14px;">${bookingReference}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Assigned Mentor:</span>
          <span class="card-val">${mentorName} (${mentorEmail || 'Academic Ops'})</span>
        </div>
        <div class="card-row">
          <span class="card-label">Your Local Time:</span>
          <span class="card-val"><span class="highlight-time">${parentTimeInfo.intervalStr}</span></span>
        </div>
        <div class="card-row">
          <span class="card-label">Selected Timezone:</span>
          <span class="card-val">${parentTimeInfo.timezoneDisplay}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Mentor Local Time:</span>
          <span class="card-val">${mentorTimeInfo.intervalStr}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Session Duration:</span>
          <span class="card-val">${durationMinutes} Minutes</span>
        </div>
      </div>

      <a href="${demoClassLink}" class="btn-link" target="_blank">Join 1:1 Demo Classroom</a>

      <div class="notice">
        <strong>Demo Meeting Note:</strong> This is a secure 1:1 demonstration classroom link. Please join 5 minutes early on a computer or tablet.
      </div>

      <div class="policy-box">
        <strong>Free Trial Policy:</strong> Exactly one free trial class is allowed per normalized Gmail account. To reschedule or cancel, reply to this email quoting your booking reference <strong>${bookingReference}</strong>.
      </div>
    </div>
    <div class="footer">
      <p>Need assistance or have questions? Simply reply to this email quoting your booking reference <strong>${bookingReference}</strong>.<br/>&copy; ${new Date().getFullYear()} Codeyoung. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, text, html };
};

/**
 * Build Mentor Confirmation Email Template
 */
export const buildMentorEmail = ({
  mentorName,
  bookingReference,
  parentName,
  parentEmail,
  parentTimezone,
  startAt,
  endAt,
  mentorTimezone = SCHEDULING_CONFIG.MENTOR_TIMEZONE,
  demoClassLink,
  durationMinutes = SCHEDULING_CONFIG.CLASS_DURATION_MINUTES,
}) => {
  const mentorTimeInfo = formatDateTimeForEmail(startAt, endAt, mentorTimezone);
  const parentTimeInfo = parentTimezone ? formatDateTimeForEmail(startAt, endAt, parentTimezone) : null;

  const subject = `New Trial Class Assigned: ${parentName} [Ref: ${bookingReference}]`;

  const text = `
Dear ${mentorName},

A new 1:1 Trial Class has been assigned to you.

Session Details:
- Booking Reference: ${bookingReference}
- Parent / Student: ${parentName}
- Parent Contact Email: ${parentEmail}
- Date & Time (Your Local IST): ${mentorTimeInfo.intervalStr}
- Mentor Timezone: ${mentorTimeInfo.timezoneDisplay}
${parentTimeInfo ? `- Parent Local Time: ${parentTimeInfo.intervalStr} (${parentTimeInfo.timezoneDisplay})` : ''}
- Duration: ${durationMinutes} Minutes
- Demo Classroom Link: ${demoClassLink}

Instructions:
- Please review student trial curriculum prerequisites.
- Join the demo room 5 minutes before the start time.
- Daily capacity tracking: this class is counted towards your maximum 2 classes limit on this India calendar day.
- To view your complete schedule, open the mentor portal: https://meet.codeyoung.com/#mentor

Happy Teaching!
Codeyoung Academic Operations
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea); color: #ffffff; padding: 32px 28px; text-align: left; }
    .header h1 { margin: 0 0 8px 0; font-size: 22px; font-weight: 800; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .body-content { padding: 28px; }
    .card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #64748b; font-weight: 600; }
    .card-val { color: #0f172a; font-weight: 700; text-align: right; }
    .highlight-time { color: #7c3aed; background: #f3e8ff; padding: 2px 8px; border-radius: 6px; font-weight: 800; }
    .btn-link { display: block; background: #4f46e5; color: #ffffff !important; text-decoration: none; text-align: center; padding: 14px 20px; border-radius: 10px; font-weight: 700; font-size: 14px; margin: 24px 0 12px 0; }
    .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5; }
    .notice { font-size: 12px; color: #64748b; background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 3px solid #7c3aed; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Mentor Assignment</div>
      <h1>New Trial Class Scheduled</h1>
      <p>Hello ${mentorName}, a new 1:1 session has been assigned to your calendar.</p>
    </div>
    <div class="body-content">
      <div class="card">
        <div class="card-row">
          <span class="card-label">Booking Reference:</span>
          <span class="card-val" style="font-family: monospace; font-size: 14px;">${bookingReference}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Parent / Student:</span>
          <span class="card-val">${parentName}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Parent Contact:</span>
          <span class="card-val">${parentEmail}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Date & Time (Your Time):</span>
          <span class="card-val"><span class="highlight-time">${mentorTimeInfo.intervalStr}</span></span>
        </div>
        <div class="card-row">
          <span class="card-label">Your Timezone:</span>
          <span class="card-val">${mentorTimeInfo.timezoneDisplay}</span>
        </div>
        ${parentTimeInfo ? `
        <div class="card-row">
          <span class="card-label">Parent Local Time:</span>
          <span class="card-val">${parentTimeInfo.intervalStr}</span>
        </div>
        ` : ''}
        <div class="card-row">
          <span class="card-label">Class Duration:</span>
          <span class="card-val">${durationMinutes} Minutes</span>
        </div>
      </div>

      <a href="${demoClassLink}" class="btn-link" target="_blank">Open Mentor Demo Room</a>

      <div class="notice">
        <strong>Mentor Reminder:</strong> Please enter the room 5 minutes prior to start time with curriculum slides ready.
      </div>
    </div>
    <div class="footer">
      <p>Codeyoung Academic Operations Portal &copy; ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, text, html };
};


/**
 * Send individual email safely and return delivery metadata
 */
export const sendEmailSafely = async ({ to, subject, html, text }) => {
  const transporter = await getTransporter();

  try {
    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    return {
      success: true,
      messageId: info.messageId || `msg-${Date.now()}`,
      previewUrl: previewUrl || undefined,
      error: null,
    };
  } catch (err) {
    // Sanitize error to avoid credential leakage
    const safeError = err.message ? err.message.replace(/([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+):([^\s@]+)/g, '$1:***') : 'SMTP Delivery Error';
    console.error(`[Email Delivery Failure] Could not deliver email to ${to}:`, safeError);
    return {
      success: false,
      messageId: null,
      previewUrl: null,
      error: safeError,
    };
  }
};

/**
 * Process and dispatch notifications for a booking record with retry safety / idempotency.
 * 
 * Guarantees:
 * - Separate parent and mentor delivery tracking.
 * - Idempotent: skips already sent emails unless force=true.
 * - Non-blocking: failures update metadata in PostgreSQL without throwing unhandled exceptions.
 * 
 * @param {number|string} bookingIdOrRef ID or booking reference
 * @param {Object} options Configuration options
 * @param {boolean} options.force If true, re-sends even if previously marked sent
 */
export const sendBookingNotifications = async (bookingIdOrRef, options = { force: false }) => {
  if (!bookingIdOrRef) {
    return { status: 'failed', error: 'Booking identifier is required' };
  }

  try {
    // 1. Fetch complete booking with mentor info
    const isNumeric = typeof bookingIdOrRef === 'number' || /^\d+$/.test(bookingIdOrRef);
    const sql = `
      SELECT 
        b.id,
        b.booking_reference,
        b.parent_name,
        b.parent_email,
        b.parent_timezone,
        b.start_at,
        b.end_at,
        b.demo_class_link,
        b.status,
        b.notification,
        m.id as mentor_id,
        m.name as mentor_name,
        m.email as mentor_email,
        m.timezone as mentor_timezone
      FROM bookings b
      JOIN mentors m ON b.mentor_id = m.id
      WHERE ${isNumeric ? 'b.id = $1' : 'b.booking_reference = $1'}
    `;

    const res = await query(sql, [isNumeric ? parseInt(bookingIdOrRef, 10) : bookingIdOrRef]);
    if (res.rows.length === 0) {
      return { status: 'failed', error: `Booking "${bookingIdOrRef}" not found` };
    }

    const booking = res.rows[0];
    const existingNotification = (typeof booking.notification === 'object' && booking.notification) ? booking.notification : {};

    const parentNotif = existingNotification.parent || {};
    const mentorNotif = existingNotification.mentor || {};

    const results = {
      status: 'pending',
      parent: { ...parentNotif },
      mentor: { ...mentorNotif },
      lastAttemptAt: new Date().toISOString(),
    };

    // 2. Dispatch Parent Email if not already sent or forced
    if (options.force || parentNotif.status !== 'sent') {
      const parentTemplate = buildParentEmail({
        parentName: booking.parent_name,
        bookingReference: booking.booking_reference,
        mentorName: booking.mentor_name,
        mentorEmail: booking.mentor_email,
        startAt: new Date(booking.start_at),
        endAt: new Date(booking.end_at),
        parentTimezone: booking.parent_timezone,
        mentorTimezone: booking.mentor_timezone || SCHEDULING_CONFIG.MENTOR_TIMEZONE,
        demoClassLink: booking.demo_class_link,
      });

      const parentDelivery = await sendEmailSafely({
        to: booking.parent_email,
        subject: parentTemplate.subject,
        html: parentTemplate.html,
        text: parentTemplate.text,
      });

      results.parent = {
        status: parentDelivery.success ? 'sent' : 'failed',
        recipient: booking.parent_email,
        sentAt: parentDelivery.success ? new Date().toISOString() : null,
        messageId: parentDelivery.messageId,
        previewUrl: parentDelivery.previewUrl || null,
        error: parentDelivery.error,
      };
    }

    // 3. Dispatch Mentor Email if not already sent or forced
    if (options.force || mentorNotif.status !== 'sent') {
      const mentorTemplate = buildMentorEmail({
        mentorName: booking.mentor_name,
        bookingReference: booking.booking_reference,
        parentName: booking.parent_name,
        parentEmail: booking.parent_email,
        parentTimezone: booking.parent_timezone,
        startAt: new Date(booking.start_at),
        endAt: new Date(booking.end_at),
        mentorTimezone: booking.mentor_timezone || SCHEDULING_CONFIG.MENTOR_TIMEZONE,
        demoClassLink: booking.demo_class_link,
      });

      const mentorDelivery = await sendEmailSafely({
        to: booking.mentor_email,
        subject: mentorTemplate.subject,
        html: mentorTemplate.html,
        text: mentorTemplate.text,
      });

      results.mentor = {
        status: mentorDelivery.success ? 'sent' : 'failed',
        recipient: booking.mentor_email,
        sentAt: mentorDelivery.success ? new Date().toISOString() : null,
        messageId: mentorDelivery.messageId,
        previewUrl: mentorDelivery.previewUrl || null,
        error: mentorDelivery.error,
      };
    }

    // 4. Compute overall notification status
    const parentSuccess = results.parent.status === 'sent';
    const mentorSuccess = results.mentor.status === 'sent';

    if (parentSuccess && mentorSuccess) {
      results.status = 'sent';
    } else if (parentSuccess || mentorSuccess) {
      results.status = 'partial';
    } else {
      results.status = 'failed';
    }

    // 5. Update PostgreSQL record with delivery status
    await query(
      'UPDATE bookings SET notification = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(results), booking.id]
    );

    return results;
  } catch (err) {
    console.error('[Notification Job Error]:', err.message);
    return {
      status: 'failed',
      error: 'Failed to process notifications',
      lastAttemptAt: new Date().toISOString(),
    };
  }
};
