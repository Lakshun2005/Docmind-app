'use client';

// All react-pdf imports are isolated here so they are NEVER evaluated during
// SSR or webpack static analysis. This file is only loaded via dynamic() with
// { ssr: false } from Workspace.tsx, which prevents pdfjs-dist from running
// Object.defineProperty calls before browser globals are ready.
import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker src inside the module body — this file only ever runs in the browser.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(1);

  function onLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Document file={url} onLoadSuccess={onLoadSuccess}>
        {Array.from(new Array(numPages), (_, index) => (
          <div
            key={`page_${index + 1}`}
            className="shadow-[0_1px_3px_rgba(0,0,0,.08),0_0_0_1px_rgba(0,0,0,.04)] bg-white rounded-md overflow-hidden mb-4"
          >
            <Page
              pageNumber={index + 1}
              width={680}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </div>
        ))}
      </Document>
    </div>
  );
}
