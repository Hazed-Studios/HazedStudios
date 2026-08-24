import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { Order_ID, Customer_Name, Customer_Email, Phone, Governorate, Address, Products, Sizes, Colors, Total, Payment_Method } = req.body;

  if (!Customer_Name || !Products) {
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

    const mailOptions = {
      from: `"${Customer_Name}" <hazed.co.hr@gmail.com>`,
      to: 'hazed.co.hr@gmail.com',
      subject: `New Purchase Order #${Order_ID || 'New'} from ${Customer_Name}`,
      html: `
        <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid rgba(192, 127, 69, 0.2); border-radius: 8px; background-color: #faf6f0; color: #1a1208;">
          <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; margin-top: 0; margin-bottom: 24px; color: #1a1208; border-bottom: 1px solid rgba(192, 127, 69, 0.2); padding-bottom: 12px;">
            New Purchase Order #${Order_ID || ''}
          </h2>
          <div style="background-color: #f2ebe0; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Customer Name:</strong> ${Customer_Name}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Email:</strong> ${Customer_Email || '-'}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Phone:</strong> ${Phone}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Governorate:</strong> ${Governorate}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Address:</strong> ${Address}</p>
          </div>
          <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 300; color: #C07F45; margin-bottom: 12px;">Order Details</h3>
          <div style="border-left: 3px solid #C07F45; padding-left: 12px; margin-bottom: 24px;">
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Products:</strong> ${Products}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Sizes:</strong> ${Sizes}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px;">Colors:</strong> ${Colors}</p>
          </div>
          <div style="border-top: 1px solid rgba(192, 127, 69, 0.2); padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #9a8878; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; display: block;">Payment Method:</strong>
              <span style="font-size: 14px; font-weight: 600;">${Payment_Method}</span>
            </div>
            <div style="text-align: right;">
              <strong style="color: #C07F45; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; display: block;">Total Amount:</strong>
              <span style="font-family: 'Times New Roman', Times, serif; font-size: 24px; color: #1a1208; font-weight: bold;">${Total}</span>
            </div>
          </div>
        </div>
      `,
      replyTo: Customer_Email
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'Purchase email sent successfully.' });
  } catch (err) {
    console.error('Purchase email error:', err);
    return res.status(500).json({ error: 'Failed to send purchase email.' });
  }
}
