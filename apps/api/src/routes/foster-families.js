import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /foster-families/notify
// Sends email notification to foster family when assigned a dog
router.post('/notify', async (req, res) => {
  const { foster_family_email, dog_name, assignment_date } = req.body;

  // Validate required fields
  if (!foster_family_email || !dog_name || !assignment_date) {
    return res.status(400).json({
      error: 'Missing required fields: foster_family_email, dog_name, assignment_date',
    });
  }

  try {
    // Send email using PocketBase built-in mailer
    await pb.sendEmail({
      to: foster_family_email,
      subject: `Welcome to Foster Family Program - ${dog_name}`,
      html: `
        <h2>Welcome to Kudrat Humane Living Trust Foster Family Program!</h2>
        <p>Dear Foster Family,</p>
        <p>We are delighted to inform you that <strong>${dog_name}</strong> has been assigned to your care starting from <strong>${assignment_date}</strong>.</p>
        
        <h3>Care Instructions:</h3>
        <ul>
          <li><strong>Feeding:</strong> Provide fresh water daily and feed twice a day with high-quality dog food</li>
          <li><strong>Exercise:</strong> Ensure at least 30-60 minutes of daily exercise and playtime</li>
          <li><strong>Health:</strong> Monitor for any signs of illness and contact us immediately if needed</li>
          <li><strong>Socialization:</strong> Help the dog adjust to home environment and introduce to family members gradually</li>
          <li><strong>Grooming:</strong> Regular brushing and bathing as needed</li>
          <li><strong>Safety:</strong> Keep the dog in a safe, secure environment with proper fencing</li>
        </ul>
        
        <h3>Important Contacts:</h3>
        <p>If you have any questions or concerns, please reach out to our team immediately.</p>
        
        <p>Thank you for opening your heart and home to ${dog_name}!</p>
        <p>Best regards,<br/>Kudrat Humane Living Trust Team</p>
      `,
    });

    logger.info(`Foster family notification sent to ${foster_family_email} for dog ${dog_name}`);
    res.json({
      success: true,
      message: `Notification sent to ${foster_family_email}`,
    });
  } catch (error) {
    logger.error(`Failed to send foster family notification: ${error.message}`);
    throw new Error(`Failed to send email notification: ${error.message}`);
  }
});

export default router;