/**
 * QR Code Print Templates - Druckbare Vorlagen für Partner
 * Table Tents, Flyer, Schaufenster-Aufkleber
 */
import React, { useState, useRef } from 'react';
import { QrCode, Download, Printer, Eye, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';

const PrintTemplates = ({ qrBase64, partnerName, partnerLogo, targetUrl, t }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('table_tent');
  const printRef = useRef(null);

  const templates = [
    { 
      id: 'table_tent', 
      name: t?.('tableTent') || 'Tischaufsteller',
      size: '10 x 15 cm',
      icon: '🪑'
    },
    { 
      id: 'flyer', 
      name: t?.('flyer') || 'Flyer A6',
      size: '10.5 x 14.8 cm',
      icon: '📄'
    },
    { 
      id: 'window', 
      name: t?.('windowSticker') || 'Schaufenster',
      size: '15 x 15 cm',
      icon: '🪟'
    },
    { 
      id: 'receipt', 
      name: t?.('receipt') || 'Kassenbon',
      size: '8 cm breit',
      icon: '🧾'
    }
  ];

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BidBlitz QR Code - ${partnerName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const downloadAsImage = () => {
    // Create canvas from the template
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size based on template
    const sizes = {
      table_tent: { width: 400, height: 600 },
      flyer: { width: 420, height: 592 },
      window: { width: 600, height: 600 },
      receipt: { width: 320, height: 500 }
    };
    
    const size = sizes[selectedTemplate] || sizes.table_tent;
    canvas.width = size.width;
    canvas.height = size.height;
    
    // Draw background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    
    // Load and draw QR code
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = Math.min(size.width - 80, 300);
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = selectedTemplate === 'receipt' ? 120 : 180;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      
      // Draw text
      ctx.fillStyle = '#1F2937';
      ctx.textAlign = 'center';
      
      // Title
      ctx.font = 'bold 24px system-ui';
      ctx.fillText('🎯 BidBlitz', canvas.width / 2, 50);
      
      // Partner name
      ctx.font = 'bold 20px system-ui';
      ctx.fillText(partnerName || 'Partner', canvas.width / 2, 90);
      
      // Subtitle
      ctx.font = '16px system-ui';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Scannen für', canvas.width / 2, 130);
      ctx.fillText('exklusive Angebote!', canvas.width / 2, 155);
      
      // CTA at bottom
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 18px system-ui';
      ctx.fillText('Gutscheine • Rabatte • Mehr', canvas.width / 2, qrY + qrSize + 50);
      
      // Download
      const link = document.createElement('a');
      link.download = `bidblitz-qr-${selectedTemplate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    qrImg.src = qrBase64;
  };

  return (
    <div className="space-y-6" data-testid="print-templates">
      {/* Template Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template.id)}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              selectedTemplate === template.id
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-3xl block mb-2">{template.icon}</span>
            <p className="font-medium text-gray-800">{template.name}</p>
            <p className="text-xs text-gray-500">{template.size}</p>
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="bg-gray-100 rounded-xl p-8">
        <div className="flex justify-center">
          <div 
            ref={printRef}
            className={`bg-white shadow-2xl ${
              selectedTemplate === 'table_tent' ? 'w-64 h-96' :
              selectedTemplate === 'flyer' ? 'w-72 h-[420px]' :
              selectedTemplate === 'window' ? 'w-80 h-80' :
              'w-48 h-80'
            }`}
            style={{
              border: '4px solid #F59E0B',
              borderRadius: selectedTemplate === 'window' ? '0' : '12px'
            }}
          >
            {/* Template Content */}
            <div className="h-full flex flex-col items-center justify-center p-4">
              {/* Logo/Brand */}
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-gray-800">🎯 BidBlitz</p>
                <p className="text-lg font-medium text-amber-600">{partnerName}</p>
              </div>

              {/* Scan Text */}
              <p className="text-sm text-gray-500 mb-4">
                {selectedTemplate === 'receipt' ? 'Scannen:' : 'Scannen für exklusive Angebote!'}
              </p>

              {/* QR Code */}
              {qrBase64 && (
                <img 
                  src={qrBase64} 
                  alt="QR Code" 
                  className={`${
                    selectedTemplate === 'receipt' ? 'w-32 h-32' :
                    selectedTemplate === 'window' ? 'w-48 h-48' :
                    'w-40 h-40'
                  }`}
                />
              )}

              {/* CTA */}
              <div className="mt-4 text-center">
                <p className="text-amber-600 font-bold text-sm">
                  {selectedTemplate === 'receipt' 
                    ? '→ Gutscheine sichern!' 
                    : 'Gutscheine • Rabatte • Mehr'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button onClick={handlePrint} className="bg-amber-500 hover:bg-amber-600">
          <Printer className="w-4 h-4 mr-2" />
          {t?.('print') || 'Drucken'}
        </Button>
        <Button onClick={downloadAsImage} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          {t?.('downloadPNG') || 'Als PNG speichern'}
        </Button>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">
          💡 {t?.('printTips') || 'Drucktipps'}
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• {t?.('printTip1') || 'Verwenden Sie dickes Papier (mind. 200g/m²) für Tischaufsteller'}</li>
          <li>• {t?.('printTip2') || 'Laminieren Sie Schaufenster-Aufkleber für längere Haltbarkeit'}</li>
          <li>• {t?.('printTip3') || 'Platzieren Sie QR-Codes auf Augenhöhe für bessere Sichtbarkeit'}</li>
        </ul>
      </div>
    </div>
  );
};

export default PrintTemplates;
