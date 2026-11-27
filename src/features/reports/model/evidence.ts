import type { EvidenceRef, ReportContent } from './contracts';
export function evidenceLocation(block: ReportContent['extractedDocument']['blocks'][number]) {
  const location = block.location;
  switch (location.kind) {
    case 'PDF':
      return `PDF 第 ${location.page} 页`;
    case 'DOCX':
      return `DOCX 段落 ${location.paragraph}（从0开始）${location.table ? `，表格 ${location.table.index} 行 ${location.table.row} 单元格 ${location.table.cell}（从0开始）` : ''}`;
    case 'TEXT':
      return `文本段落 ${location.paragraph}（从0开始）`;
  }
}
export function sourceKey(ref: EvidenceRef) {
  return `${ref.sourceVersionId}:${ref.blockId}:${ref.start}:${ref.end}`;
}
