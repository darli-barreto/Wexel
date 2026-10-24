import { memo } from 'react';
import { reportMetadata, REPORT_HEIGHT, REPORT_WIDTH, REPORT_MARGIN, type MetradoReport, type ReportRow } from './documentPreview';
import wordStyles from '../WordCanvas.module.css';
import styles from './MetradoDocument.module.css';

function Rows({ rows, heading = false }: { rows: ReportRow[]; heading?: boolean }) {
  return rows.map(row => <tr key={row.sourceRow} style={{ height: row.height }}>
    {row.cells.map(cell => {
      const Tag = heading ? 'th' : 'td';
      return <Tag key={cell.col} colSpan={cell.span} rowSpan={cell.rowSpan} style={{ textAlign: cell.align, fontWeight: cell.bold ? 'bold' : 'normal', fontStyle: cell.italic ? 'italic' : 'normal', textDecoration: [cell.underline ? 'underline' : '', cell.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none', color: cell.color, backgroundColor: cell.background }}>{cell.text}</Tag>;
    })}
  </tr>);
}
export default memo(function MetradoDocumentPages({ report, isSplit }: { report: MetradoReport; isSplit: boolean }) {
  return <div data-metrado-report className={`${wordStyles.document} ${styles.report}`} style={{ width: REPORT_WIDTH, marginInline: isSplit ? 0 : 'auto' }} aria-label="Vista previa de documentos de metrados">
    {report.pages.map((page, index) => <article data-report-page data-report-sheet={page.sheet} key={`${page.sheet}-${page.sectionPage}`} className={styles.page} style={{ width: REPORT_WIDTH, minHeight: REPORT_HEIGHT, padding: REPORT_MARGIN }} aria-label={`${page.label}, página ${page.sectionPage}`}>
      <header className={styles.header} style={{ minHeight: report.headerHeight }}>
        <h1>{report.header.title || 'METRADOS'}</h1><h2>{page.label}</h2>
        <div className={styles.metadata}>{reportMetadata(report.header).map(([label, value]) => <div key={label}><strong>{label}:</strong> {value || '—'}</div>)}</div>
      </header>
      <table className={styles.table} aria-label={page.label}>
        <colgroup>{page.columns.map(column => <col key={column.col} style={{ width: column.width }} />)}</colgroup>
        <thead><Rows rows={page.headings} heading /></thead>
        <tbody>{page.rows.length ? <Rows rows={page.rows} /> : <tr><td colSpan={page.columns.length} className={styles.empty}>Sin registros en esta hoja.</td></tr>}</tbody>
      </table>
      <footer className={styles.footer}><span>{page.label}</span><span>Página {index + 1} de {report.pages.length}</span></footer>
    </article>)}
  </div>;
});
