import multer from 'multer';
import nodemailer from 'nodemailer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await new Promise((resolve, reject) => {
      upload.single('Attachment')(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } catch (err) {
    return res.status(500).json({ error: 'File upload failed' });
  }

  const { Name, Email, Message, InquiryType, OrderID } = req.body || {};
  const file = req.file;

  if (!Name || !Email || !Message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'hazed.co.hr@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    const inquiryLabel = InquiryType ? InquiryType.charAt(0).toUpperCase() + InquiryType.slice(1) : 'General';
    const orderIdHtml = OrderID ? `<p style="margin: 8px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Order ID:</strong> <br/>${OrderID}</p>` : '';

    const mailOptions = {
      from: `"${Name}" <hazed.co.hr@gmail.com>`,
      to: 'hazed.co.hr@gmail.com',
      subject: `New ${inquiryLabel} Inquiry from ${Name}`,
      html: `
        <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid rgba(192, 127, 69, 0.2); border-radius: 8px; background-color: #faf6f0; color: #1a1208;">
          <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; margin-top: 0; margin-bottom: 24px; color: #1a1208; border-bottom: 1px solid rgba(192, 127, 69, 0.2); padding-bottom: 12px;">
            New ${inquiryLabel} Inquiry
          </h2>
          <div style="margin-bottom: 24px;">
            <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Inquiry Type:</strong> <br/>${inquiryLabel}</p>
            ${orderIdHtml}
            <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Name:</strong> <br/>${Name}</p>
            <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Email:</strong> <br/><a href="mailto:${Email}" style="color: #C07F45; text-decoration: none;">${Email}</a></p>
          </div>
          <div style="background-color: #f2ebe0; border-left: 3px solid #C07F45; padding: 16px; border-radius: 4px;">
            <strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; display: block; margin-bottom: 8px;">Message:</strong>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${Message}</p>
          </div>
        </div>
      `,
      replyTo: Email
    };

    if (file) {
      mailOptions.attachments = [
        {
          filename: file.originalname,
          content: file.buffer
        }
      ];
    }

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Contact email error:', err);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
}
