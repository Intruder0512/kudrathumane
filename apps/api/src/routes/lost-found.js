import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /lost-found/match
// Matches lost and found reports and sends notification to owner
router.post('/match', async (req, res) => {
  const { lost_report_id, found_report_id } = req.body;

  // Validate required fields
  if (!lost_report_id || !found_report_id) {
    return res.status(400).json({
      error: 'Missing required fields: lost_report_id, found_report_id',
    });
  }

  try {
    // Fetch lost report
    const lostReport = await pb.collection('lost_found_reports').getOne(lost_report_id);
    if (!lostReport) {
      return res.status(404).json({ error: 'Lost report not found' });
    }

    // Fetch found report
    const foundReport = await pb.collection('lost_found_reports').getOne(found_report_id);
    if (!foundReport) {
      return res.status(404).json({ error: 'Found report not found' });
    }

    // Update lost report to mark as matched
    await pb.collection('lost_found_reports').update(lost_report_id, {
      status: 'matched',
      matched_with: found_report_id,
      matched_date: new Date().toISOString(),
    });

    // Update found report to mark as matched
    await pb.collection('lost_found_reports').update(found_report_id, {
      status: 'matched',
      matched_with: lost_report_id,
      matched_date: new Date().toISOString(),
    });

    // Send email notification to owner
    const ownerEmail = lostReport.owner_email || lostReport.contact_email;
    if (ownerEmail) {
      await pb.sendEmail({
        to: ownerEmail,
        subject: 'Great News! Your Lost Dog Has Been Found!',
        html: `
          <h2>Great News from Kudrat Humane Living Trust!</h2>
          <p>Dear ${lostReport.owner_name || 'Pet Owner'},</p>
          <p>We have wonderful news! Your lost dog <strong>${lostReport.dog_name || 'your pet'}</strong> has been found!</p>
          
          <h3>Found Dog Details:</h3>
          <ul>
            <li><strong>Description:</strong> ${foundReport.description || 'N/A'}</li>
            <li><strong>Location Found:</strong> ${foundReport.location || 'N/A'}</li>
            <li><strong>Date Found:</strong> ${foundReport.found_date || 'N/A'}</li>
            <li><strong>Condition:</strong> ${foundReport.condition || 'Good'}</li>
          </ul>
          
          <h3>Next Steps:</h3>
          <p>Please contact us immediately to arrange the reunion with your beloved pet. Our team will help facilitate the handover process.</p>
          
          <p>Contact Information: ${foundReport.contact_info || 'Please check your account for contact details'}</p>
          
          <p>We are thrilled to help reunite you with your furry friend!</p>
          <p>Best regards,<br/>Kudrat Humane Living Trust Team</p>
        `,
      });
    }

    logger.info(`Lost and found reports matched: ${lost_report_id} with ${found_report_id}`);
    res.json({
      success: true,
      message: 'Reports matched successfully and notification sent to owner',
      matchedReports: {
        lostReportId: lost_report_id,
        foundReportId: found_report_id,
      },
    });
  } catch (error) {
    logger.error(`Failed to match lost and found reports: ${error.message}`);
    throw new Error(`Failed to match reports: ${error.message}`);
  }
});

export default router;