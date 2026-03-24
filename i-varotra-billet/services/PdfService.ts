import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ticket } from './TicketService';
import { Event } from './EventService';

export const PdfService = {
  exportTicketsToPdf: async (event: Event, tickets: Ticket[]) => {
    // Generate HTML for 3x3 layout (Recto on page 1, Verso on page 2)
    // For 9 tickets, we need at least 2 pages (or more if more than 9 tickets)
    
    const themeColor = event.color || '#007AFF';
    
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
            padding: 5mm; 
            display: flex; 
            flex-direction: column; 
            justify-content: space-between;
            align-items: center;
            text-align: center;
            overflow: hidden;
            position: relative;
          }
          .ticket-recto { background-color: #FFF; border-left: 2mm solid ${themeColor}; }
          .ticket-verso { background-color: #F9F9F9; border-right: 2mm solid ${themeColor}; }
          .event-name { font-size: 14pt; font-weight: bold; color: ${themeColor}; margin-bottom: 2mm; text-transform: uppercase; }
          .event-date { font-size: 10pt; color: #666; margin-bottom: 3mm; }
          .ticket-num { font-size: 12pt; font-weight: bold; background: #EEE; padding: 1mm 3mm; border-radius: 4mm; color: #333; }
          .qr-code { width: 35mm; height: 35mm; margin: 3mm 0; }
          .slogan { font-size: 9pt; font-style: italic; color: ${themeColor}; margin-top: 2mm; }
          .description { font-size: 8pt; color: #444; text-align: left; line-height: 1.2; padding: 2mm; background: rgba(255,255,255,0.7); border-radius: 2mm; z-index: 2; }
          .info-footer { font-size: 7pt; color: #999; border-top: 0.1mm solid #EEE; padding-top: 1mm; width: 100%; z-index: 2; }
          .verso-image {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            object-fit: cover;
            opacity: 0.2;
            z-index: 1;
          }
        </style>
      </head>
      <body>
    `;

    // Split tickets into chunks of 9
    for (let i = 0; i < tickets.length; i += 9) {
      const chunk = tickets.slice(i, i + 9);
      
      // Rectos page
      htmlContent += `<div class="page">`;
      chunk.forEach(t => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(t.qr_code)}`;
        htmlContent += `
          <div class="ticket ticket-recto">
            <div class="event-name">${event.name || 'ÉVÉNEMENT'}</div>
            <div class="event-date">${event.event_date}</div>
            <div class="ticket-num">${t.ticket_number}</div>
            <img class="qr-code" src="${qrUrl}" />
            <div class="slogan">${event.slogan || ''}</div>
          </div>
        `;
      });
      // Fill empty cells if chunk < 9
      for (let j = chunk.length; j < 9; j++) {
        htmlContent += `<div class="ticket"></div>`;
      }
      htmlContent += `</div>`;

      // Versos page (Mirrored)
      htmlContent += `<div class="page">`;
      // To mirror: Row 1 [1,2,3] becomes [3,2,1] on the back
      for (let row = 0; row < 3; row++) {
        const rowTickets = chunk.slice(row * 3, row * 3 + 3);
        const fullRow = [...rowTickets];
        while (fullRow.length < 3) fullRow.push(null as any);
        
        fullRow.reverse().forEach(t => {
          if (t) {
            htmlContent += `
              <div class="ticket ticket-verso">
                ${event.image ? `<img src="${event.image}" class="verso-image" />` : ''}
                <div class="description">${event.description || 'Merci de votre participation !'}</div>
                <div class="info-footer">Billet : ${t.ticket_number} | Prix : ${t.price} Ar</div>
              </div>
            `;
          } else {
            htmlContent += `<div class="ticket"></div>`;
          }
        });
      }
      htmlContent += `</div>`;
    }

    htmlContent += `
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      return true;
    } catch (error) {
      console.error('Export error:', error);
      return false;
    }
  }
};
