import type { VercelRequest, VercelResponse } from '@vercel/node';
import sgMail from '@sendgrid/mail';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { plan, callsign, date, takeoffTime, pilotEmail, pilotName } = req.body;

        const apiKey = process.env.SENDGRID_API_KEY;
        // User requested target email via env variable with fallback to barelp@gmail.com
        const targetEmail = process.env.SEND_TO_EMAIL || process.env.VITE_SEND_TO_EMAIL || 'barelp@gmail.com';
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || targetEmail;

        if (!apiKey) {
            return res.status(500).json({ message: 'Server Configuration Error: SENDGRID_API_KEY is not defined' });
        }

        // Initialize SendGrid SDK
        sgMail.setApiKey(apiKey);

        const subject = `${callsign || 'N/A'} - ${pilotName || 'N/A'} - ${date || new Date().toISOString().split('T')[0]} ${takeoffTime || ''}`.trim();

        const msg = {
            to: targetEmail,
            // As discussed, sending FROM the verified generic sendgrid address, with the Pilot's email linked as ReplyTo
            from: fromEmail,
            replyTo: pilotEmail ? { email: pilotEmail } : undefined,
            subject: subject,
            text: plan
        };

        await sgMail.send(msg);

        return res.status(200).json({
            message: 'Email sent successfully via SendGrid',
            details: {
                to: msg.to,
                from: msg.from,
                subject: msg.subject
            }
        });
    } catch (error: unknown) {
        console.error('SendGrid Execution Error:', error);

        // Detailed error extraction from the SendGrid SDK structure if present
        let errorBody = (error as Error).message;
        if ((error as any).response && (error as any).response.body) {
            errorBody = JSON.stringify((error as any).response.body);
        }

        return res.status(500).json({ message: 'Failed to send email via SendGrid', error: errorBody });
    }
}
