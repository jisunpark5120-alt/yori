import React from 'react';

const NUM = `\\d+(?:[\\s/.~-]+\\d+)*`;
const TIME_REGEX = new RegExp(`(${NUM}\\s*(?:시간|분|초)|반나절|하루)`, 'g');
const QUANTITY_REGEX = new RegExp(`(${NUM}\\s*(?:큰술|작은술|스푼|숟가락|숟갈|컵|ml|g|kg|L|개|장|모|대|줄기|쪽|봉지|캔|공기|줌|인분|cm)|(?:약간|조금|적당량|톡톡|취향껏))`, 'g');

export function highlightText(text: string): React.ReactNode[] {
  type Segment = { start: number; end: number; type: 'time' | 'quantity' };
  const segments: Segment[] = [];

  let match: RegExpExecArray | null;

  const timeRe = new RegExp(TIME_REGEX.source, 'g');
  while ((match = timeRe.exec(text)) !== null) {
    segments.push({ start: match.index, end: match.index + match[0].length, type: 'time' });
  }

  const qtyRe = new RegExp(QUANTITY_REGEX.source, 'g');
  while ((match = qtyRe.exec(text)) !== null) {
    const overlaps = segments.some(
      (s) => match!.index < s.end && match!.index + match![0].length > s.start
    );
    if (!overlaps) {
      segments.push({ start: match.index, end: match.index + match[0].length, type: 'quantity' });
    }
  }

  segments.sort((a, b) => a.start - b.start);

  if (segments.length === 0) return [text];

  const result: React.ReactNode[] = [];
  let cursor = 0;

  segments.forEach((seg, i) => {
    if (cursor < seg.start) {
      result.push(text.slice(cursor, seg.start));
    }
    const cls = seg.type === 'time' ? 'bg-highlight-time rounded px-1' : 'bg-highlight-quantity rounded px-1';
    result.push(
      <mark key={i} className={cls}>
        {text.slice(seg.start, seg.end)}
      </mark>
    );
    cursor = seg.end;
  });

  if (cursor < text.length) {
    result.push(text.slice(cursor));
  }

  return result;
}
