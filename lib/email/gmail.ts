import { google } from 'googleapis';

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

export async function sendVerificationEmail(toEmail: string, studentName: string, verificationLink: string) {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const subject = 'Verify Your AIDS Student Portal Account';
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #4F46E5; margin: 0;">AIDS</h1>
              <p style="font-weight: bold; margin: 0;">Artificial Intelligence and Data Science</p>
            </div>
            <p>Hello ${studentName},</p>
            <p>Your AIDS Student Portal account has been created successfully.</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #4F46E5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify My Email</a>
            </div>
            <p>After verification, you can sign in to your Student Portal account.</p>
            <p style="font-size: 0.9em; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 0.8em; word-break: break-all;"><a href="${verificationLink}">${verificationLink}</a></p>
            <p>If you did not create this account, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.9em; color: #888; text-align: center;">
              Regards,<br>
              <strong>AIDS Student Portal</strong><br>
              Artificial Intelligence and Data Science
            </p>
          </div>
        </body>
      </html>
    `;

    const messageParts = [
      `To: ${toEmail}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent
    ];

    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return { success: true, messageId: res.data.id };
  } catch (error) {
    console.error('[EMAIL][GMAIL] Error sending email:', error);
    throw new Error('Failed to send verification email.');
  }
}