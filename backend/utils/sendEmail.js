// ============================================
// EMAIL SENDER UTILITY (Nodemailer)
// ============================================
import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // ──────────────────────────────────────
  // 1. Create Transporter
  // ──────────────────────────────────────
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,                    // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,      // Self-signed certificates allow
    },
  });

  // ──────────────────────────────────────
  // 2. Email Options
  // ──────────────────────────────────────
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,            // Plain text version
    html: options.html || null,       // HTML version (optional)
  };

  // ──────────────────────────────────────
  // 3. Send Email
  // ──────────────────────────────────────
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`.green);
    return info;
  } catch (error) {
    console.error(`❌ Email Error: ${error.message}`.red);
    throw new Error('Email could not be sent');
  }
};

// ──────────────────────────────────────
// Email Templates
// ──────────────────────────────────────

// Welcome Email
export const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; text-align: center; margin: 0;">🛒 Welcome to E-Commerce!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${user.name}! 👋</h2>
        <p style="color: #666; font-size: 16px;">
          Thank you for creating an account with us. We're excited to have you on board!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}" 
             style="background: #667eea; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; font-size: 16px;">
            Start Shopping 🛍️
          </a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">
          © 2024 E-Commerce Platform. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: '🎉 Welcome to E-Commerce Platform!',
    message: `Hello ${user.name}, Welcome to our platform!`,
    html,
  });
};

// Password Reset Email
export const sendPasswordResetEmail = async (user, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; text-align: center; margin: 0;">🔐 Password Reset</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${user.name},</h2>
        <p style="color: #666; font-size: 16px;">
          You requested a password reset. Click the button below to reset your password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #f5576c; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; font-size: 16px;">
            Reset Password 🔑
          </a>
        </div>
        <p style="color: #999; font-size: 14px;">
          This link will expire in <strong>10 minutes</strong>.
        </p>
        <p style="color: #999; font-size: 14px;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: '🔐 Password Reset Request',
    message: `You requested a password reset. Go to: ${resetUrl}`,
    html,
  });
};

// Order Confirmation Email
export const sendOrderConfirmationEmail = async (user, order) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; text-align: center; margin: 0;">✅ Order Confirmed!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${user.name},</h2>
        <p style="color: #666; font-size: 16px;">
          Your order <strong>#${order._id}</strong> has been confirmed!
        </p>
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Order Total:</strong> $${order.totalPrice}</p>
          <p><strong>Items:</strong> ${order.orderItems.length}</p>
          <p><strong>Status:</strong> ${order.orderStatus}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/orders/${order._id}" 
             style="background: #11998e; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; font-size: 16px;">
            Track Order 📦
          </a>
        </div>
      </div>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: `✅ Order Confirmed - #${order._id}`,
    message: `Your order #${order._id} has been confirmed.`,
    html,
  });
};

export default sendEmail;