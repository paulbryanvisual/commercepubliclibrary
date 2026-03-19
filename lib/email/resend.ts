// Email service using Resend — gracefully degrades when RESEND_API_KEY is missing

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Commerce Public Library <noreply@commercepubliclibrary.org>";
const STAFF_EMAIL = process.env.LIBRARY_STAFF_EMAIL || "director@commercepubliclibrary.org";

/* ---------- shared styles ---------- */
const emailWrapper = (body: string) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#3d3d3a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F4;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:#085041;padding:24px 32px;">
            <h1 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.3px;">Commerce Public Library</h1>
            <p style="margin:4px 0 0;font-size:13px;color:#9FE1CB;">1210 Park Street, Commerce, TX 75428</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #E5E4E0;">
            <p style="margin:0;font-size:12px;color:#A3A29E;line-height:1.6;">
              Commerce Public Library &middot; (903) 886-6858<br>
              <a href="https://commercepubliclibrary.org" style="color:#1D9E75;text-decoration:none;">commercepubliclibrary.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

/* ---------- send helper ---------- */
async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log(`[Email] RESEND_API_KEY not set — would send "${subject}" to ${to}`);
    console.log(`[Email] HTML preview (first 200 chars): ${html.slice(0, 200)}`);
    return { success: true }; // graceful fallback
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[Email] Resend error: ${err}`);
      return { success: false, error: err };
    }

    return { success: true };
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return { success: false, error: String(err) };
  }
}

/* ---------- notification helper ---------- */
async function notifyStaff(subject: string, html: string) {
  return sendEmail(STAFF_EMAIL, subject, html);
}

/* ---------- public email functions ---------- */

export interface PassportAppointmentDetails {
  name: string;
  email: string;
  phone?: string;
  date: string;
  type: string;
  applicants: number;
}

export async function sendPassportConfirmation(to: string, details: PassportAppointmentDetails) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#085041;">Passport Appointment Requested</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#73726c;line-height:1.6;">
      Thank you, ${details.name}! We've received your passport appointment request. We will confirm your appointment via email within 1 business day.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E1F5EE;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#085041;text-transform:uppercase;letter-spacing:0.5px;">Appointment Details</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Date</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.date}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Type</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.type}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Applicants</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.applicants}</td></tr>
          ${details.phone ? `<tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Phone</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.phone}</td></tr>` : ""}
        </table>
      </td></tr>
    </table>
    <h3 style="margin:0 0 8px;font-size:16px;font-weight:600;color:#3d3d3a;">What to Bring</h3>
    <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#52514C;line-height:1.8;">
      <li>Completed DS-11 form (do NOT sign until at the library)</li>
      <li>Proof of U.S. citizenship</li>
      <li>Valid photo ID + photocopy</li>
      <li>Passport photo (or $12 for on-site photo)</li>
      <li>Payment for fees</li>
    </ul>
    <p style="margin:0;font-size:13px;color:#A3A29E;">
      Questions? Call us at <a href="tel:9038866858" style="color:#1D9E75;">(903) 886-6858</a>
    </p>
  `;

  // Send confirmation to patron
  await sendEmail(to, "Passport Appointment Request — Commerce Public Library", emailWrapper(body));

  // Notify staff
  const staffBody = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#085041;">New Passport Appointment Request</h2>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Name</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.name}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Email</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;"><a href="mailto:${details.email}" style="color:#1D9E75;">${details.email}</a></td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Phone</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.phone || "Not provided"}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Date</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.date}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Type</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.type}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Applicants</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.applicants}</td></tr>
    </table>
  `;
  await notifyStaff("New Passport Appointment Request", emailWrapper(staffBody));
}

export interface RoomBookingDetails {
  organization: string;
  contactName: string;
  email: string;
  phone?: string;
  date: string;
  startTime: string;
  endTime: string;
  attendance?: number;
  purpose?: string;
}

export async function sendRoomBookingConfirmation(to: string, details: RoomBookingDetails) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#085041;">Meeting Room Request Received</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#73726c;line-height:1.6;">
      Thank you, ${details.contactName}! We've received your meeting room reservation request. We will confirm availability via email within 1 business day.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E1F5EE;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#085041;text-transform:uppercase;letter-spacing:0.5px;">Booking Details</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Organization</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.organization}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Date</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.date}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Time</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.startTime} &ndash; ${details.endTime}</td></tr>
          ${details.attendance ? `<tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Attendance</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.attendance}</td></tr>` : ""}
          ${details.purpose ? `<tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Purpose</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.purpose}</td></tr>` : ""}
        </table>
      </td></tr>
    </table>
    <h3 style="margin:0 0 8px;font-size:16px;font-weight:600;color:#3d3d3a;">Room Guidelines</h3>
    <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#52514C;line-height:1.8;">
      <li>Room must be left clean</li>
      <li>No food or drink other than water</li>
      <li>Library policies apply at all times</li>
    </ul>
    <p style="margin:0;font-size:13px;color:#A3A29E;">
      Questions? Call us at <a href="tel:9038866858" style="color:#1D9E75;">(903) 886-6858</a>
    </p>
  `;

  await sendEmail(to, "Meeting Room Request — Commerce Public Library", emailWrapper(body));

  // Notify staff
  const staffBody = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#085041;">New Meeting Room Request</h2>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Organization</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.organization}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Contact</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.contactName}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Email</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;"><a href="mailto:${details.email}" style="color:#1D9E75;">${details.email}</a></td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Phone</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.phone || "Not provided"}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Date</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.date}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Time</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.startTime} &ndash; ${details.endTime}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Attendance</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.attendance || "Not specified"}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Purpose</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.purpose || "Not specified"}</td></tr>
    </table>
  `;
  await notifyStaff("New Meeting Room Request", emailWrapper(staffBody));
}

export interface LibraryCardDetails {
  name: string;
  email: string;
  cardNumber?: string;
}

export async function sendLibraryCardConfirmation(to: string, details: LibraryCardDetails) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#085041;">Welcome to Commerce Public Library!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#73726c;line-height:1.6;">
      Hi ${details.name}, your library card application has been received. Visit us to pick up your card and start borrowing!
    </p>
    ${details.cardNumber ? `<p style="margin:0 0 24px;font-size:14px;color:#3d3d3a;">Your card number: <strong>${details.cardNumber}</strong></p>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E1F5EE;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#085041;text-transform:uppercase;letter-spacing:0.5px;">What You Can Do</p>
        <ul style="margin:0;padding-left:20px;font-size:14px;color:#085041;line-height:1.8;">
          <li>Borrow books, DVDs, and audiobooks</li>
          <li>Access free ebooks and digital resources</li>
          <li>Use public computers and WiFi</li>
          <li>Attend free events and programs</li>
        </ul>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#A3A29E;">
      Visit us at 1210 Park Street, Commerce, TX 75428
    </p>
  `;

  await sendEmail(to, "Welcome to Commerce Public Library!", emailWrapper(body));
}

export interface EventRegistrationDetails {
  name: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location?: string;
}

export interface LibraryCardStaffDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
}

export async function sendLibraryCardStaffNotification(details: LibraryCardStaffDetails) {
  const staffBody = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#085041;">New Library Card Application</h2>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Name</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.firstName} ${details.lastName}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Email</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;"><a href="mailto:${details.email}" style="color:#1D9E75;">${details.email}</a></td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Phone</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.phone}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Address</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.address}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Date of Birth</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.dob}</td></tr>
    </table>
  `;
  await notifyStaff("New Library Card Application", emailWrapper(staffBody));
}

export async function sendEventRegistration(to: string, details: EventRegistrationDetails) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#085041;">You're Registered!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#73726c;line-height:1.6;">
      Hi ${details.name}, you're signed up for the following event. We look forward to seeing you!
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E1F5EE;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#085041;text-transform:uppercase;letter-spacing:0.5px;">Event Details</p>
        <h3 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#3d3d3a;">${details.eventTitle}</h3>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Date</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.eventDate}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Time</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.eventTime}</td></tr>
          ${details.location ? `<tr><td style="padding:4px 16px 4px 0;font-size:14px;color:#73726c;font-weight:500;">Location</td><td style="padding:4px 0;font-size:14px;color:#3d3d3a;">${details.location}</td></tr>` : ""}
        </table>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#A3A29E;">
      Can't make it? Please let us know at <a href="tel:9038866858" style="color:#1D9E75;">(903) 886-6858</a>
    </p>
  `;

  await sendEmail(to, `Registered: ${details.eventTitle} — Commerce Public Library`, emailWrapper(body));
}
