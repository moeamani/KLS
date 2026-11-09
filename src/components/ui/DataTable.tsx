import { Card, cn, Table } from '@heroui/react';
import type { ReactNode } from 'react';

export interface Column<T> { key: string; label: ReactNode; render: (row: T) => ReactNode; className?: string; rowHeader?: boolean }

/** A list table on a card. Rows link with `href`, or call `onAction`. */
export function DataTable<T>({ columns, rows, getId, href, onAction, empty, minWidth = 760, label, header, footer, className, flat = false }: {
  columns: Column<T>[];
  rows: T[];
  getId: (row: T) => string;
  href?: (row: T) => string | undefined;
  onAction?: (row: T) => void;
  empty?: ReactNode;
  minWidth?: number;
  label: string;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  flat?: boolean;
}) {
  const table = (
    <Table variant="secondary" className="rounded-none border-0 shadow-none">
      <Table.ScrollContainer>
        <Table.Content aria-label={label} style={{ minWidth }} onRowAction={onAction ? (key) => { const row = rows.find((r) => getId(r) === key); if (row) onAction(row); } : undefined}>
          <Table.Header>
            {columns.map((col, index) => (
              <Table.Column key={col.key} id={col.key} isRowHeader={col.rowHeader ?? index === 0} className={col.className}>
                {col.label}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body items={rows.map((row) => ({ row, id: getId(row) }))} renderEmptyState={() => empty ?? <div className="py-10 text-center text-[13px] text-muted">موردی پیدا نشد.</div>}>
            {(item) => (
              <Table.Row id={item.id} href={href?.(item.row)}>
                {columns.map((col) => (
                  <Table.Cell key={col.key} className={col.className}>{col.render(item.row)}</Table.Cell>
                ))}
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
  if (flat) return table;
  return (
    <Card className={cn('gap-0 overflow-hidden p-0', className)}>
      {header ? <div className="flex flex-wrap items-center gap-3 border-b border-separator px-4 py-3">{header}</div> : null}
      {table}
      {footer}
    </Card>
  );
}
