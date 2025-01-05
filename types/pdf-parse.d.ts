declare module "pdf-parse" {
  interface PDFInfo {
    PDFFormatVersion: string;
    IsAcroFormPresent: boolean;
    IsXFAPresent: boolean;
    Creator?: string;
    Producer?: string;
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    CreationDate?: string;
    ModDate?: string;
  }

  interface PDFMetadata {
    "dc:creator"?: string;
    "dc:title"?: string;
    "dc:description"?: string;
    "dc:subject"?: string;
    "dc:date"?: string;
    "dc:format"?: string;
    "dc:language"?: string;
    [key: string]: string | undefined;
  }

  interface PDFData {
    text: string;
    numpages: number;
    info: PDFInfo;
    metadata: PDFMetadata;
    version: string;
  }

  interface PageData {
    pageNumber: number;
    text: string;
  }

  function pdf(
    dataBuffer: Buffer,
    options?: {
      pagerender?: (pageData: PageData) => string;
      max?: number;
      version?: string;
    }
  ): Promise<PDFData>;

  export = pdf;
}
