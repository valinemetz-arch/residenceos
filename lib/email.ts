import nodemailer from "nodemailer";

// Configure your email service here
// For Gmail: use App Password, enable 2FA
// For other services: use SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER || "noreply@residenceos.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendMessageNotification(
  recipientEmail: string,
  senderName: string,
  projectName: string,
  message: string,
  projectId: string
) {
  try {
    const projectUrl = `${APP_URL}/contractor/projects/${projectId}`;

    const htmlContent = `
      <h2>New Message on "${projectName}"</h2>
      <p><strong>${senderName}</strong> sent you a message:</p>
      <blockquote style="background: #f0f0f0; padding: 10px; border-left: 4px solid #0066cc;">
        ${message}
      </blockquote>
      <p><a href="${projectUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Message</a></p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        This is an automated message from ResidenceOS. Do not reply to this email.
      </p>
    `;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `New message from ${senderName} on ${projectName}`,
      html: htmlContent,
    });

    console.log(`Message notification sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Failed to send message notification:", error);
    // Don't throw - messaging should work even if email fails
  }
}

export async function sendBidReminderEmail(
  contractorEmail: string,
  contractorName: string,
  projectName: string,
  projectId: string,
  daysElapsed: number
) {
  try {
    const projectUrl = `${APP_URL}/contractor/projects/${projectId}`;

    const htmlContent = `
      <h2>Reminder: Complete Your Bid for "${projectName}"</h2>
      <p>Hi ${contractorName},</p>
      <p>You started the bid process for <strong>${projectName}</strong> ${daysElapsed} day${daysElapsed > 1 ? "s" : ""} ago but haven't submitted your bid yet.</p>
      <p>To stay competitive, please complete and submit your bid as soon as possible. Don't forget to include:</p>
      <ul>
        <li>Your bid amount</li>
        <li>Any relevant notes</li>
      </ul>
      <p><a href="${projectUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Complete Your Bid</a></p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        This is an automated reminder from ResidenceOS.
      </p>
    `;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: contractorEmail,
      subject: `Reminder: Submit Your Bid for ${projectName}`,
      html: htmlContent,
    });

    console.log(`Bid reminder sent to ${contractorEmail}`);
  } catch (error) {
    console.error("Failed to send bid reminder:", error);
  }
}

export async function sendIncompleteSubmissionReminderEmail(
  contractorEmail: string,
  contractorName: string,
  projectName: string,
  projectId: string,
  missingItems: string[]
) {
  try {
    const projectUrl = `${APP_URL}/contractor/projects/${projectId}`;

    const itemsList = missingItems
      .map((item) => `<li>${item}</li>`)
      .join("");

    const htmlContent = `
      <h2>Complete Your Submission for "${projectName}"</h2>
      <p>Hi ${contractorName},</p>
      <p>We noticed you viewed the bid page for <strong>${projectName}</strong> but haven't completed your submission.</p>
      <p>To submit your bid, you'll need to provide:</p>
      <ul>
        ${itemsList}
      </ul>
      <p><a href="${projectUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Complete Your Bid Now</a></p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        Questions? Reply to this email or visit the project page to ask questions.
      </p>
    `;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: contractorEmail,
      subject: `Complete Your Bid Submission for ${projectName}`,
      html: htmlContent,
    });

    console.log(`Incomplete submission reminder sent to ${contractorEmail}`);
  } catch (error) {
    console.error("Failed to send incomplete submission reminder:", error);
  }
}

export async function sendContractSigningEmail(
  contractorEmail: string,
  contractorName: string,
  projectName: string,
  signingUrl: string
) {
  try {
    const htmlContent = `
      <h2>Contract Ready for Signature</h2>
      <p>Hi ${contractorName},</p>
      <p>Your contract for <strong>${projectName}</strong> is ready for signature.</p>
      <p>Please review and sign the contract by clicking the button below. The signing process is quick and secure.</p>
      <p><a href="${signingUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Sign Contract</a></p>
      <p>This link is personalized for you and will expire in 90 days.</p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        If you have any questions about the contract, please contact the project owner.
      </p>
    `;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: contractorEmail,
      subject: `Contract Ready to Sign: ${projectName}`,
      html: htmlContent,
    });

    console.log(`Contract signing email sent to ${contractorEmail}`);
  } catch (error) {
    console.error("Failed to send contract signing email:", error);
    throw error;
  }
}

export async function sendContractSignedEmail(
  ownerEmail: string,
  contractorName: string,
  projectName: string,
  projectId: string
) {
  try {
    const projectUrl = `${APP_URL}/app`;

    const htmlContent = `
      <h2>Contract Signed Successfully</h2>
      <p>The contract for <strong>${projectName}</strong> has been signed by <strong>${contractorName}</strong>.</p>
      <p>The signed contract is now available in your project records.</p>
      <p><a href="${projectUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Project</a></p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        This is an automated notification from ResidenceOS.
      </p>
    `;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: ownerEmail,
      subject: `Contract Signed: ${projectName}`,
      html: htmlContent,
    });

    console.log(`Contract signed notification sent to ${ownerEmail}`);
  } catch (error) {
    console.error("Failed to send contract signed email:", error);
    // Don't throw - notification should not block operations
  }
}

export async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log("✅ Email service is connected and ready");
    return true;
  } catch (error) {
    console.error("❌ Email service connection failed:", error);
    return false;
  }
}
