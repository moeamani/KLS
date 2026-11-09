import { ChevronLeft, ChevronRight } from '@gravity-ui/icons';
import { Pagination } from '@heroui/react';
import { faNumber } from '@/lib/format';

// Chevrons are set explicitly: in RTL «previous» points right and «next» points left.

/** Page numbers with ellipses: 1 … 4 5 6 … 12 */
const pages = (current: number, total: number): (number | 'gap')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const result: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) result.push('gap');
  for (let page = start; page <= end; page += 1) result.push(page);
  if (end < total - 1) result.push('gap');
  result.push(total);
  return result;
};

export function TablePagination({ page, pageSize, total, onChange, noun = 'مورد' }: { page: number; pageSize: number; total: number; onChange: (page: number) => void; noun?: string }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <Pagination className="flex flex-wrap items-center justify-between gap-3 border-t border-separator px-5 py-3">
      <Pagination.Summary className="text-[13px] text-muted">
        نمایش {faNumber(from)} تا {faNumber(to)} از {faNumber(total)} {noun}
      </Pagination.Summary>
      {pageCount > 1 ? (
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous isDisabled={page === 1} onPress={() => onChange(page - 1)} aria-label="صفحه قبل">
              <ChevronRight className="size-4" />
            </Pagination.Previous>
          </Pagination.Item>
          {pages(page, pageCount).map((entry, index) =>
            entry === 'gap' ? (
              <Pagination.Item key={`gap-${index}`}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={entry}>
                <Pagination.Link isActive={entry === page} onPress={() => onChange(entry)} aria-label={`صفحه ${faNumber(entry)}`}>
                  {faNumber(entry)}
                </Pagination.Link>
              </Pagination.Item>
            ),
          )}
          <Pagination.Item>
            <Pagination.Next isDisabled={page === pageCount} onPress={() => onChange(page + 1)} aria-label="صفحه بعد">
              <ChevronLeft className="size-4" />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      ) : null}
    </Pagination>
  );
}
