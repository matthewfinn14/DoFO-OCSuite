import React from 'react';

/**
 * Injects dynamic CSS to control the browser's print dialog.
 * This ensures that when the user clicks 'Print', the dialog defaults 
 * to the correct orientation and margins.
 */
export default function PrintPageStyle({ orientation = 'portrait', margins = '0.25in' }) {
    // We use a style tag to inject the @page rule.
    // This rule is only respected when printing.
    return (
        <style suppressHydrationWarning>{`
      @media print {
        @page {
          size: letter ${orientation};
          margin: ${margins};
        }
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
          background-color: white !important;
        }
        /* Restore visibility for print-show elements since some frameworks hide body */
        .print-show {
          visibility: visible !important;
        }
      }
    `}</style>
    );
}
