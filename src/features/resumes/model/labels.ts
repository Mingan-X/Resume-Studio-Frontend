import type { ResumeVersion } from './contracts';

export const warningLabels: Record<ResumeVersion['extractedDocument']['warnings'][number], string> =
  {
    READING_ORDER_UNCERTAIN: '阅读顺序可能不准确，请对照原文件核实。',
    TABLE_LAYOUT_LOST: '表格布局未保留，请核对单元格内容。',
    PARTIAL_TEXT_LAYER: '部分内容没有文本层，无法提取全部文字。',
  };
export function locationLabel(
  location: ResumeVersion['extractedDocument']['blocks'][number]['location'],
): string {
  switch (location.kind) {
    case 'PDF':
      return `PDF 第 ${location.page} 页`;
    case 'DOCX':
      return `DOCX 段落 ${location.paragraph}（从0开始）${location.table ? ` · 表格 ${location.table.index} / 行 ${location.table.row} / 单元格 ${location.table.cell}（从0开始）` : ''}`;
    case 'TEXT':
      return `文本段落 ${location.paragraph}（从0开始）`;
  }
}
