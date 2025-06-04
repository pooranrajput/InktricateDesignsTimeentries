import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Gmail service for sending emails via GSuite
class GmailService {
  private oauth2Client: OAuth2Client;
  private gmail: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    if (process.env.GOOGLE_REFRESH_TOKEN) {
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  private async getAccessToken() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to get access token');
    }
  }

  private createMessage(to: string, subject: string, body: string, from?: string) {
    const fromAddress = from || process.env.ADMIN_EMAIL || 'admin@inktricatedesigns.com';
    
    const message = [
      `To: ${to}`,
      `From: ${fromAddress}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');

    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  }

  async sendEmail(to: string, subject: string, body: string, from?: string) {
    try {
      await this.getAccessToken();
      
      const raw = this.createMessage(to, subject, body, from);
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: raw,
        },
      });

      console.log('Email sent successfully:', response.data.id);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendPaymentNotification(employeeEmail: string, employeeName: string, month: string, year: string, amount: string) {
    const subject = `Payment Processed - ${month} ${year} Timesheet`;
    const body = `
Dear ${employeeName},

Your timesheet for ${month} ${year} has been processed and payment has been completed.

Payment Details:
- Period: ${month} ${year}
- Amount: $${amount}

The payment should appear in your account within 1-2 business days.

Thank you for your continued dedication to Inktricate Designs.

Best regards,
Inktricate Designs Management
    `.trim();

    return await this.sendEmail(employeeEmail, subject, body);
  }

  async sendTimesheetSubmissionNotification(adminEmail: string, completedEmployees: string[], totalEmployees: number, month: string, year: string) {
    const subject = `Monthly Timesheet Submissions Complete - ${month} ${year}`;
    const body = `
Dear Admin,

All employees have submitted their timesheets for ${month} ${year}.

Submission Summary:
- Total Employees: ${totalEmployees}
- Completed Submissions: ${completedEmployees.length}
- Ready for Review: ${completedEmployees.join(', ')}

Please review and process payroll in the admin dashboard.

Access your dashboard: ${process.env.APP_URL || 'https://your-app-url.replit.app'}

Best regards,
Inktricate Designs Time Tracking System
    `.trim();

    return await this.sendEmail(adminEmail, subject, body);
  }
}

export const gmailService = new GmailService();