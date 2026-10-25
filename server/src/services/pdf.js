const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { decryptBuffer } = require('./crypto');

/**
 * Generate PDF report stream for an incident
 * @param {object} incident 
 * @param {Array} evidenceList 
 * @param {object} edits 
 * @param {NodeJS.WritableStream} outStream 
 */
async function generateIncidentPdf(incident, evidenceList, edits = {}, outStream) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(outStream);

      // Colors based on brand design system
      const primaryColor = '#007CBE';
      const textColor = '#0B2A3A';
      const lightBg = '#F0F8FC';
      const subtleBorder = '#D0E3EF';

      // --- 1. COVER / HEADER ---
      doc.rect(40, 40, 515, 60).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
        .text('SAFESAKHI INCIDENT REPORT', 55, 52);
      doc.fontSize(10).font('Helvetica')
        .text('CONFIDENTIAL DIGITAL EVIDENCE SUMMARY & TIMELINE', 55, 78);

      doc.moveDown(2);
      doc.fillColor(textColor);

      // Incident Summary Box
      const boxY = 115;
      doc.rect(40, boxY, 515, 110).fillAndStroke(lightBg, subtleBorder);
      
      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold')
        .text(edits.title || incident.title, 55, boxY + 15);

      doc.fillColor(textColor).fontSize(10).font('Helvetica');
      doc.text(`Platform: ${incident.platform || 'N/A'}`, 55, boxY + 38);
      doc.text(`Accused Identifier/Handle: ${incident.accused_handle || 'Unknown'}`, 250, boxY + 38);
      doc.text(`Report Generated: ${new Date().toUTCString()}`, 55, boxY + 54);
      doc.text(`Total Evidence Items: ${evidenceList.length}`, 250, boxY + 54);

      doc.font('Helvetica-Oblique').text(
        `Summary: ${edits.summary || incident.summary || 'No summary provided.'}`,
        55, boxY + 72, { width: 480, lineBreak: true, height: 40 }
      );

      // Cybercrime Portal Advisory Box
      doc.rect(40, 235, 515, 45).fillAndStroke('#FFFDE6', '#E2D87C');
      doc.fillColor('#7A6500').fontSize(9).font('Helvetica-Bold')
        .text('Official National Cybercrime Reporting Channels:', 50, 243);
      doc.font('Helvetica')
        .text('National Cyber Crime Reporting Portal: https://cybercrime.gov.in   |   Helpline: 1930', 50, 258);

      // --- 2. CHRONOLOGICAL TIMELINE ---
      let currentY = 295;
      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold')
        .text('CHRONOLOGICAL TIMELINE OF EVENTS', 40, currentY);
      currentY += 24;

      // Sort chronological by occurred_at
      const sortedItems = [...evidenceList].sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));

      for (let i = 0; i < sortedItems.length; i++) {
        const item = sortedItems[i];
        if (currentY > 720) {
          doc.addPage();
          currentY = 50;
        }

        // Timeline node
        doc.circle(48, currentY + 6, 4).fill(primaryColor);
        doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold')
          .text(`Item #${i + 1} - ${new Date(item.occurred_at).toLocaleString()}`, 60, currentY);

        const desc = item.description || (item.original_name ? `File: ${item.original_name}` : 'Evidence logged');
        doc.font('Helvetica').fontSize(9).fillColor('#333333')
          .text(desc, 60, currentY + 14, { width: 480 });

        currentY += 36;
      }

      // --- 3. DETAILED EVIDENCE CATALOG WITH THUMBNAILS & HASHES ---
      doc.addPage();
      currentY = 40;
      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold')
        .text('DIGITAL EVIDENCE ARTIFACTS & INTEGRITY HASHES', 40, currentY);
      currentY += 20;

      for (let i = 0; i < sortedItems.length; i++) {
        const item = sortedItems[i];
        if (currentY > 640) {
          doc.addPage();
          currentY = 50;
        }

        const cardY = currentY;
        const cardHeight = item.type === 'image' && item.file_path ? 140 : 85;
        doc.rect(40, cardY, 515, cardHeight).fillAndStroke('#FAFAFA', subtleBorder);

        doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
          .text(`Evidence #${i + 1} [Type: ${item.type.toUpperCase()}]`, 55, cardY + 10);

        doc.fillColor(textColor).fontSize(9).font('Helvetica');
        doc.text(`Recorded Date/Time: ${new Date(item.occurred_at).toUTCString()}`, 55, cardY + 26);
        doc.text(`Original Filename: ${item.original_name || 'N/A'}`, 55, cardY + 38);

        if (item.url) {
          doc.text(`Source URL: ${item.url}`, 55, cardY + 50, { width: 480 });
        }

        // Integrity verification SHA-256
        doc.font('Courier').fontSize(8).fillColor('#444444')
          .text(`SHA-256 Digest: ${item.sha256 || 'N/A'}`, 55, cardY + 64);

        if (item.duplicate_of) {
          doc.fillColor('#A35200').font('Helvetica-Bold').fontSize(8)
            .text(`Notice: Match identified with ${item.duplicate_of}`, 55, cardY + 76);
        }

        // Embed image thumbnail if available and encrypted
        if (item.type === 'image' && item.file_path && fs.existsSync(item.file_path)) {
          try {
            const encryptedData = fs.readFileSync(item.file_path);
            let decryptedImage;
            if (item.iv && item.auth_tag) {
              decryptedImage = decryptBuffer(encryptedData, item.iv, item.auth_tag);
            } else {
              decryptedImage = encryptedData;
            }

            doc.image(decryptedImage, 420, cardY + 12, { fit: [115, 115] });
          } catch (imgErr) {
            doc.font('Helvetica-Oblique').fontSize(8).fillColor('#888888')
              .text('[Image thumbnail preview encrypted]', 420, cardY + 50);
          }
        }

        currentY += cardHeight + 15;
      }

      // --- 4. FORENSIC INTEGRITY & VERIFICATION NOTE ---
      if (currentY > 680) {
        doc.addPage();
        currentY = 50;
      }

      doc.moveDown(1);
      doc.rect(40, currentY, 515, 60).fillAndStroke(lightBg, subtleBorder);
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text('Forensic Evidence Verification Statement', 50, currentY + 10);
      doc.fillColor(textColor).fontSize(8).font('Helvetica').text(
        'All digital files cataloged above are encrypted with AES-256-GCM at rest upon upload. ' +
        'Cryptographic SHA-256 hashes were computed prior to encryption to maintain an immutable chain of custody ' +
        'for submission to law enforcement and legal authorities pursuant to applicable digital evidence standards.',
        50, currentY + 24, { width: 495 }
      );

      doc.end();
      outStream.on('finish', resolve);
      outStream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateIncidentPdf
};
