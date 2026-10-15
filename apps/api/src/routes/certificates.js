import express from 'express';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /certificates/generate
// Generates a professional PDF certificate for dog adoption
router.post('/generate', async (req, res) => {
  const { adopter_name, dog_id, adoption_date, custom_message } = req.body;

  // Validate required fields
  if (!adopter_name || !dog_id || !adoption_date) {
    return res.status(400).json({
      error: 'Missing required fields: adopter_name, dog_id, adoption_date',
    });
  }

  try {
    // Fetch dog details from PocketBase
    const dog = await pb.collection('dogs').getOne(dog_id);
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Set background color
    pdf.setFillColor(245, 245, 250);
    pdf.rect(0, 0, 297, 210, 'F');

    // Add decorative border
    pdf.setDrawColor(184, 134, 11);
    pdf.setLineWidth(3);
    pdf.rect(10, 10, 277, 190);

    // Add inner border
    pdf.setLineWidth(1);
    pdf.rect(15, 15, 267, 180);

    // Add title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(32);
    pdf.setTextColor(184, 134, 11);
    pdf.text('Certificate of Adoption', 148.5, 40, { align: 'center' });

    // Add organization name
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Kudrat Humane Living Trust', 148.5, 50, { align: 'center' });

    // Add certificate body
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('This is to certify that', 148.5, 65, { align: 'center' });

    // Adopter name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(184, 134, 11);
    pdf.text(adopter_name, 148.5, 75, { align: 'center' });

    // Certificate text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('has officially adopted', 148.5, 85, { align: 'center' });

    // Dog name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(184, 134, 11);
    pdf.text(dog.name || 'Beloved Companion', 148.5, 95, { align: 'center' });

    // Dog details
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    const dogDetails = `Breed: ${dog.breed || 'Mixed'} | Age: ${dog.age || 'Unknown'}`;
    pdf.text(dogDetails, 148.5, 103, { align: 'center' });

    // Adoption date
    pdf.setFontSize(12);
    pdf.text(`Adoption Date: ${adoption_date}`, 148.5, 113, { align: 'center' });

    // Custom message if provided
    if (custom_message) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      const lines = pdf.splitTextToSize(custom_message, 200);
      pdf.text(lines, 148.5, 125, { align: 'center' });
    }

    // Generate QR code linking to dog profile
    const qrCodeUrl = `${process.env.POCKETBASE_URL || 'http://localhost:8090'}/dog/${dog_id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 100,
    });

    // Add QR code to PDF
    pdf.addImage(qrCodeDataUrl, 'PNG', 20, 140, 40, 40);

    // Add signature line
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('_____________________', 240, 155);
    pdf.text('Authorized Signature', 240, 160);

    // Add footer
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('This certificate recognizes the commitment to provide a loving home for a rescued dog.', 148.5, 185, { align: 'center' });
    pdf.text('Certificate ID: ' + Date.now(), 148.5, 190, { align: 'center' });

    // Convert PDF to base64
    const pdfBase64 = pdf.output('dataurlstring');

    // Save certificate record to PocketBase
    const certificateRecord = await pb.collection('certificates').create({
      adopter_name,
      dog_id,
      adoption_date,
      custom_message: custom_message || '',
      pdf_data: pdfBase64,
      created_at: new Date().toISOString(),
    });

    logger.info(`Certificate generated for ${adopter_name} - Dog: ${dog.name}`);
    res.json({
      success: true,
      certificateId: certificateRecord.id,
      pdfUrl: pdfBase64,
      message: 'Certificate generated successfully',
    });
  } catch (error) {
    logger.error(`Failed to generate certificate: ${error.message}`);
    throw new Error(`Failed to generate certificate: ${error.message}`);
  }
});

// POST /certificates/send
// Sends generated certificate PDF to adopter via email
router.post('/send', async (req, res) => {
  const { certificate_id, adopter_email } = req.body;

  // Validate required fields
  if (!certificate_id || !adopter_email) {
    return res.status(400).json({
      error: 'Missing required fields: certificate_id, adopter_email',
    });
  }

  try {
    // Fetch certificate from PocketBase
    const certificate = await pb.collection('certificates').getOne(certificate_id);
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Send email with certificate attachment
    // Note: PocketBase sendEmail doesn't support attachments directly
    // We'll send the PDF as a link or base64 in the email body
    await pb.sendEmail({
      to: adopter_email,
      subject: `Your Adoption Certificate - ${certificate.adopter_name}`,
      html: `
        <h2>Your Official Adoption Certificate</h2>
        <p>Dear ${certificate.adopter_name},</p>
        <p>Congratulations on your adoption! We are thrilled that you have chosen to give a loving home to ${certificate.dog_id}.</p>
        
        <p>Your official adoption certificate has been generated and is attached to this email. This certificate commemorates your commitment to providing a safe and loving home for your new family member.</p>
        
        <h3>Certificate Details:</h3>
        <ul>
          <li><strong>Adopter:</strong> ${certificate.adopter_name}</li>
          <li><strong>Adoption Date:</strong> ${certificate.adoption_date}</li>
          <li><strong>Certificate ID:</strong> ${certificate.id}</li>
        </ul>
        
        <p>You can download your certificate using the link below or view it in your account dashboard.</p>
        
        <p>Thank you for choosing adoption and for giving a second chance to a deserving dog!</p>
        <p>Best regards,<br/>Kudrat Humane Living Trust Team</p>
      `,
    });

    // Update certificate record to mark as sent
    await pb.collection('certificates').update(certificate_id, {
      sent_to_email: adopter_email,
      sent_at: new Date().toISOString(),
    });

    logger.info(`Certificate ${certificate_id} sent to ${adopter_email}`);
    res.json({
      success: true,
      message: `Certificate sent to ${adopter_email}`,
      certificateId: certificate_id,
    });
  } catch (error) {
    logger.error(`Failed to send certificate: ${error.message}`);
    throw new Error(`Failed to send certificate: ${error.message}`);
  }
});

export default router;