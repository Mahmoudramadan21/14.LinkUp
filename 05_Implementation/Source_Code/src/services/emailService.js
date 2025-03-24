const sgMail = require("@sendgrid/mail");

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Function to send a password reset email
const sendResetEmail = async (email, resetLink) => {
  try {
    // Email options
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM, // Use the email you verified in SendGrid
      subject: "Password Reset",
      text: `Click the link to reset your password: ${resetLink}`,
      html: `<p>Click the link to reset your password: <a href="${resetLink}">Reset Password</a></p>`,
    };

    // Send email
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
