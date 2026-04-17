import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { Ticket } from './TicketService';
import { Event } from './EventService';
import * as FileSystem from 'expo-file-system';

export interface PdfExportOptions {
  ticketTypeId?: number;
  fromNumber?: number;
  toNumber?: number;
}

const extractNumber = (ticketNum: string | undefined): number => {
  if (!ticketNum) return 0;
  const lastDash = ticketNum.lastIndexOf('-');
  const lastUnderscore = ticketNum.lastIndexOf('_');
  const lastSeparator = Math.max(lastDash, lastUnderscore);
  if (lastSeparator === -1) return 0;
  const numStr = ticketNum.substring(lastSeparator + 1);
  return parseInt(numStr, 10);
};

export const PdfService = {
  exportTicketsToPdf: async (event: Event, tickets: Ticket[], options?: PdfExportOptions) => {
    let filteredTickets = [...tickets];
    
    if (filteredTickets.length === 0) {
      console.error('No tickets to export!');
      return false;
    }

    const safeEvent = {
      name: event?.name || 'ÉVÉNEMENT',
      event_date: event?.event_date || '',
      slogan: event?.slogan || '',
      description: event?.description || '',
      color: event?.color || '#007AFF',
      img_scale: event?.img_scale || 1.0,
      img_rotate: event?.img_rotate || 0,
      img_x: event?.img_x || 0,
      img_y: event?.img_y || 0,
    };

    const themeColor = safeEvent.color;

    // Load logo as base64
    let logoUri = '';
    const logoFallback = '<svg width="100%" height="100%" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="none" stroke="#333" stroke-width="8"/><text x="100" y="115" font-size="50" font-weight="bold" text-anchor="middle" fill="#333">iBillet</text></svg>';
    
    try {
      const logoAsset = Asset.fromModule(require('../assets/logo_iBillet.png'));
      await logoAsset.downloadAsync();
      const localUri = logoAsset.localUri || logoAsset.uri;
      const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
      logoUri = `data:image/png;base64,${base64}`;
      console.log('Logo loaded successfully');
    } catch (e) {
      console.log('Logo loading error, using fallback:', e);
    }

    let eventImageUri = '';
    if (event?.image && !event.image.startsWith('data:') && event.image.startsWith('http')) {
      eventImageUri = event.image;
    }

    let htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: 0; size: A4; }
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica', 'Arial', sans-serif; }
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
            border-radius: 2.24mm;
            overflow: hidden;
            position: relative;
            background-color: #FFF;
            border: 0.5mm dashed #CCCCCC;
            box-sizing: border-box;
          }
          
          .recto-top-section {
            width: 100%;
            height: 52%;
            background-color: ${themeColor};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding-top: 4.2mm;
            box-sizing: border-box;
          }
          .recto-slogan {
            font-size: 2.4mm;
            font-style: italic;
            color: #000;
            text-align: center;
            margin-bottom: 1.8mm;
            padding: 0 2.8mm;
            opacity: 0.8;
          }
          .recto-top-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 10;
          }
          .recto-title {
            font-size: 4mm;
            font-weight: bold;
            color: #000;
            margin-bottom: 1.2mm;
            letter-spacing: 0.56mm;
          }
          .recto-icon {
            width: 10mm;
            height: 10mm;
          }
          .recto-bottom-section {
            flex: 1;
            width: 100%;
            display: flex;
            flex-direction: column;
            padding: 4.2mm;
            padding-top: 4.2mm;
            padding-bottom: 4.2mm;
            align-items: center;
            justify-content: space-around;
            border-top-left-radius: 22.4mm;
            border-top-right-radius: 22.4mm;
            margin-top: -16.8mm;
            box-sizing: border-box;
            position: relative;
            z-index: 1;
            background-color: #FFF;
          }
          .recto-event-name {
            font-size: 3.5mm;
            font-weight: bold;
            color: ${themeColor};
            text-transform: uppercase;
            text-align: center;
            line-height: 1.1;
          }
          .recto-event-date {
            font-size: 2.8mm;
            margin-top: 1.4mm;
            color: #666;
          }
          .recto-num-box {
            background-color: #EEE;
            padding: 1.4mm 2.8mm;
            border-radius: 4.2mm;
          }
          .recto-num-text {
            font-size: 2.8mm;
            font-weight: bold;
            color: #333;
          }
          .recto-qr-code {
            width: 18mm;
            height: 18mm;
          }
          
          .ticket-verso {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
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
            transform: scale(${safeEvent.img_scale}) rotate(${safeEvent.img_rotate}deg) translate(${safeEvent.img_x}px, ${safeEvent.img_y}px);
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
            width: 28mm;
            height: 28mm;
            object-fit: contain;
          }
          .verso-description-container {
            position: absolute;
            bottom: 14mm;
            left: 2.8mm;
            right: 2.8mm;
            z-index: 10;
            text-align: center;
          }
          .verso-description {
            font-size: 2.4mm;
            color: #333;
            text-align: center;
            font-style: italic;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
    `;

    for (let i = 0; i < filteredTickets.length; i += 9) {
      const chunk = filteredTickets.slice(i, i + 9);

      htmlContent += '<div class="page">';
      chunk.forEach(t => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(t.qr_code)}`;
        htmlContent += `
          <div class="ticket">
            <div class="recto-top-section">
              ${safeEvent.slogan ? `<div class="recto-slogan">${safeEvent.slogan}</div>` : ''}
              <div class="recto-top-content">
                <div class="recto-title">BILLET</div>
                <svg class="recto-icon" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                  <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
                </svg>
              </div>
            </div>
            <div class="recto-bottom-section">
              <div class="recto-event-name">${safeEvent.name}</div>
              <div class="recto-event-date">${safeEvent.event_date}</div>
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

      htmlContent += '<div class="page">';
      chunk.forEach(t => {
        htmlContent += `
          <div class="ticket ticket-verso">
            ${eventImageUri ? `
              <div class="verso-image-container">
                <img src="${eventImageUri}" class="verso-image" />
              </div>
              <div class="verso-overlay"></div>
            ` : ''}
            <div class="verso-logo-container">
              ${logoUri ? `<img src="${logoUri}" class="verso-logo" />` : `${logoFallback}`}
            </div>
            ${safeEvent.description ? `
              <div class="verso-description-container">
                <div class="verso-description">${safeEvent.description}</div>
              </div>
            ` : ''}
          </div>
        `;
      });
      for (let j = chunk.length; j < 9; j++) {
        htmlContent += '<div class="ticket"></div>';
      }
      htmlContent += '</div>';
    }

    htmlContent += '</body></html>';

    try {
      console.log('Generating PDF with', filteredTickets.length, 'tickets');
      const result = await Print.printToFileAsync({ html: htmlContent });
      console.log('PDF generated at:', result.uri);
      
      await Sharing.shareAsync(result.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      return true;
    } catch (error) {
      console.error('Export error:', error);
      return false;
    }
  }
};