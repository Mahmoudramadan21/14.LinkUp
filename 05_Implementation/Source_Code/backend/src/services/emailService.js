const sgMail = require("@sendgrid/mail");

// Set SendGrid API Key from environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends a password reset email using SendGrid
 * @param {string} email - Recipient's email address
 * @param {string} resetLink - Link to reset the password
 */
const sendResetEmail = async (email, resetLink) => {
  try {
    // Email options for password reset
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM, // Use the email you verified in SendGrid
      subject: "Password Reset",
      text: `Click the link to reset your password: ${resetLink}`,
      html: `<p>Click the link to reset your password: <a href="${resetLink}">Reset Password</a></p>`,
    };

    // Send email via SendGrid
    const response = await sgMail.send(msg);
    console.log("Reset email sent successfully:", response);
  } catch (error) {
    console.error(
      "Error sending reset email:",
      error.response?.body || error.message
    );
    throw new Error("Failed to send reset email");
  }
};

module.exports = { sendResetEmail };
