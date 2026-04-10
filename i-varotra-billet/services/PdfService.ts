import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { Ticket } from './TicketService';
import { Event } from './EventService';
import * as FileSystem from 'expo-file-system';

/**
 * Service handling PDF generation and sharing for tickets.
 */
export const PdfService = {
  /**
   * Generates a PDF file containing printable tickets with Recto/Verso layout.
   * The layout is designed for A4 paper with a 3x3 grid (9 tickets per page).
   * @param {Event} event - The event data to display on tickets.
   * @param {Ticket[]} tickets - The list of tickets to generate.
   * @returns {Promise<boolean>} True if the PDF was generated and shared successfully.
   */
  exportTicketsToPdf: async (event: Event, tickets: Ticket[]) => {
    const themeColor = event.color || '#007AFF';

    // Load logo for verso (convert to base64 for HTML usage)
    let logoUri = '';
    try {
      const logoAsset = Asset.fromModule(require('../assets/logo_iBillet.png'));
      await logoAsset.downloadAsync();
      const localUri = logoAsset.localUri || logoAsset.uri;
      
      // Use FileSystem to read as base64
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      logoUri = `data:image/png;base64,${base64}`;
    } catch (e) {
      console.log('Logo loading error:', e);
    }

    // Load event image as base64 if present
    let eventImageUri = '';
    if (event.image) {
      try {
        const response = await fetch(event.image);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        eventImageUri = base64;
      } catch (e) {
        console.log('Event image loading error:', e);
        eventImageUri = event.image; // Fallback to original URL
      }
    }

    let htmlContent = `
      <html>
      <head>
        <style>
          @page { margin: 0; size: A4; }
          body { margin: 0; font-family: 'Helvetica', 'Arial', sans-serif; }
          .page {
            width: 210mm;
            height: 297mm;
            display: grid;
            grid-template-columns: repeat(3, 70mm);
            grid-template-rows: repeat(3, 99mm);
            page-break-after: always;
          }
          .ticket {
            width: 70mm;
            height: 99mm;
            box-sizing: border-box;
            border: 0.1mm dashed #CCC;
            overflow: hidden;
            position: relative;
          }
          .ticket-recto { background-color: #FFF; }
          .ticket-verso { background-color: #FFF; }
          
          /* RECTO styles */
          .recto-top-section {
            width: 100%;
            height: 52%;
            background-color: ${themeColor};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 3mm;
            padding-top: 5mm;
          }
          .recto-slogan {
            font-size: 3pt;
            font-style: italic;
            color: #000;
            text-align: center;
            margin-bottom: 3mm;
            opacity: 0.8;
          }
          .recto-title {
            font-size: 6pt;
            font-weight: bold;
            color: #000;
            letter-spacing: 1.5mm;
            margin-bottom: 3mm;
          }
          .recto-icon {
            width: 14mm;
            height: 14mm;
          }
          .recto-bottom-section {
            flex: 1;
            width: 100%;
            background-color: #FFF;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-around;
            padding: 5mm;
            border-top-left-radius: 30mm;
            border-top-right-radius: 30mm;
            margin-top: -18mm;
          }
          .recto-event-name {
            font-size: 4.5pt;
            font-weight: bold;
            color: ${themeColor};
            text-transform: uppercase;
            margin-bottom: 1mm;
            text-align: center;
          }
          .recto-event-date {
            font-size: 3.2pt;
            color: #666;
            margin-bottom: 2mm;
          }
          .recto-num-box {
            background-color: #EEE;
            padding: 2mm 5mm;
            border-radius: 5mm;
            margin-bottom: 2mm;
          }
          .recto-num-text {
            font-size: 3.8pt;
            font-weight: bold;
            color: #333;
          }
          .recto-qr-code {
            width: 32mm;
            height: 32mm;
          }
          
          /* VERSO styles */
          .verso-image-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            overflow: hidden;
          }
          .verso-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transform: scale(${event.img_scale || 1.0}) rotate(${event.img_rotate || 0}deg) translate(${event.img_x || 0}px, ${event.img_y || 0}px);
          }
          .verso-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255,255,255,0.7);
            z-index: 2;
          }
          .verso-logo-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .verso-logo {
            width: 34mm;
            height: 34mm;
          }
          .verso-description-container {
            position: absolute;
            bottom: 15mm;
            left: 0;
            right: 0;
            padding: 0 5mm;
            z-index: 10;
          }
          .verso-description {
            font-size: 4pt;
            color: #333;
            text-align: center;
            font-style: italic;
            line-height: 1.4;
          }
          .verso-footer {
            position: absolute;
            bottom: 3mm;
            left: 0;
            right: 0;
            text-align: center;
            z-index: 10;
          }
          .verso-footer-text {
            font-size: 3pt;
            color: #666;
            margin: 0.5mm 0;
          }
        </style>
      </head>
      <body>
    `;

    for (let i = 0; i < tickets.length; i += 9) {
      const chunk = tickets.slice(i, i + 9);

      // Page RECTO
      htmlContent += '<div class="page">';
      chunk.forEach(t => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(t.qr_code)}`;
        htmlContent += `
          <div class="ticket ticket-recto">
            <div class="recto-top-section">
              ${event.slogan ? `<div class="recto-slogan">${event.slogan}</div>` : ''}
              <div class="recto-title">BILLET</div>
              <svg class="recto-icon" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
              </svg>
            </div>
            <div class="recto-bottom-section">
              <div class="recto-event-name">${event.name || 'ÉVÉNEMENT'}</div>
              <div class="recto-event-date">${event.event_date}</div>
              <div class="recto-num-box">
                <div class="recto-num-text">${t.ticket_number}</div>
              </div>
              <img class="recto-qr-code" src="${qrUrl}" />
            </div>
          </div>
        `;
      });
      for (let j = chunk.length; j < 9; j++) {
        htmlContent += '<div class="ticket"></div>';
      }
      htmlContent += '</div>';

      // Page VERSO
      htmlContent += '<div class="page">';
      for (let row = 0; row < 3; row++) {
        const rowTickets = chunk.slice(row * 3, row * 3 + 3);
        const fullRow = [...rowTickets];
        while (fullRow.length < 3) fullRow.push(null as any);

        fullRow.reverse().forEach(t => {
          if (t) {
            htmlContent += `
              <div class="ticket ticket-verso">
                ${eventImageUri ? `
                  <div class="verso-image-container">
                    <img src="${eventImageUri}" class="verso-image" />
                  </div>
                  <div class="verso-overlay"></div>
                ` : ''}
                <div class="verso-logo-container">
                  ${logoUri ? `<img src="${logoUri}" class="verso-logo" />` : '<div style="font-size: 8pt; font-weight: bold; color: #666;">iBillet</div>'}
                </div>
                ${event.description ? `
                  <div class="verso-description-container">
                    <div class="verso-description">${event.description}</div>
                  </div>
                ` : ''}
                <div class="verso-footer">
                  <div class="verso-footer-text">© 2026 iBillet - Tous droits réservés</div>
                  <div class="verso-footer-text">📞 033 76 913 14</div>
                </div>
              </div>
            `;
          } else {
            htmlContent += '<div class="ticket"></div>';
          }
        });
      }
      htmlContent += '</div>';
    }

    htmlContent += '</body></html>';

    try {
      console.log('Generating PDF with', tickets.length, 'tickets');
      console.log('Logo URI length:', logoUri.length);
      console.log('Event image URI length:', eventImageUri ? eventImageUri.length : 0);
      
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      console.log('PDF generated at:', uri);
      
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      return true;
    } catch (error) {
      console.error('Export error:', error);
      return false;
    }
  }
};