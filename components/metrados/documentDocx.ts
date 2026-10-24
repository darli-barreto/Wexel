import { AlignmentType, BorderStyle, Document, Footer, HeightRule, PageOrientation, Paragraph, Table, TableCell, TableLayoutType, TableRow, TextRun, WidthType } from 'docx';
import { reportMetadata, type MetradoReport, type ReportRow, type ReportCell } from './documentPreview';

/** Export the same snapshot shown in Word preview, including native cell results. */
export function metradoReportDocx(report: MetradoReport) {
  const paragraph = (text: string, bold = false, size = 14, align: 'left' | 'center' | 'right' = 'left', format?: ReportCell) => new Paragraph({
    alignment: align === 'center' ? AlignmentType.CENTER : align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
    spacing: { before: 0, after: 0, line: size <= 14 ? 180 : size <= 15 ? 210 : 270 }, children: [new TextRun({ text, bold, size, font: 'Helvetica', italics: format?.italic, underline: format?.underline ? {} : undefined, strike: format?.strike, color: format?.color.replace('#', '') })],
  });
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'B9BEC3' };
  const rows = (entries: ReportRow[], heading = false) => entries.map(row => new TableRow({ tableHeader: heading, cantSplit: true, height: { value: row.height * 15, rule: HeightRule.ATLEAST },
    children: row.cells.map(cell => new TableCell({ columnSpan: cell.span, rowSpan: cell.rowSpan,
      shading: { fill: cell.background.replace('#', '') }, margins: { top: 20, bottom: 20, left: 40, right: 40 },
      borders: { top: border, bottom: border, left: border, right: border },
      children: [paragraph(cell.text, cell.bold, 14, cell.align, cell)],
    })),
  }));
  return new Document({ title: report.header.title || 'Metrados', creator: report.header.preparedBy || 'Wexel',
    sections: report.pages.map((page, index) => ({
      properties: { page: { size: { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 }, margin: { top: 600, bottom: 600, left: 600, right: 600, footer: 240 } } },
      footers: { default: new Footer({ children: [paragraph(`${page.label} · Página ${index + 1} de ${report.pages.length}`, false, 14, 'right')] }) },
      children: [paragraph(report.header.title || 'METRADOS', true, 21, 'center'), paragraph(page.label, true, 18, 'center'),
        ...reportMetadata(report.header).reduce<Paragraph[]>((output, [label, value], i, metadata) => {
          if (i % 2 === 0) output.push(paragraph(`${label}: ${value || '—'}${metadata[i + 1] ? '     ' + metadata[i + 1][0] + ': ' + (metadata[i + 1][1] || '—') : ''}`, false, 15));
          return output;
        }, []), paragraph(''),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
          columnWidths: page.columns.map(col => Math.round(col.width * 15)),
          rows: [...rows(page.headings, true), ...rows(page.rows)],
        }),
      ],
    })),
  });
}
