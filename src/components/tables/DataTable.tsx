import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  isLoading?: boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  isLoading,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-[#FAFBFF] rounded-lg border border-[#314755]/20 p-8 text-center">
        <p className="text-[#314755]/70">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFBFF] rounded-lg border border-[#314755]/20 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#314755] hover:bg-[#314755]">
            {columns.map((column, index) => (
              <TableHead key={index} className="font-semibold text-[#FAFBFF]">
                {column.header}
              </TableHead>
            ))}
            {(onView || onEdit || onDelete) && (
              <TableHead className="font-semibold text-right text-[#FAFBFF]">Ações</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((item) => (
              <TableRow key={item.id} className="hover:bg-[#86BCBE]/10 transition-colors border-b border-[#314755]/10">
                {columns.map((column, index) => (
                  <TableCell key={index} className="text-[#314755]">
                    {typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : String(item[column.accessor])}
                  </TableCell>
                ))}
                {(onView || onEdit || onDelete) && (
                  <TableCell className="text-right space-x-2">
                    {onView && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onView(item)}
                        className="hover:bg-[#314755]/20 text-[#314755] hover:text-[#314755]"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(item)}
                        className="hover:bg-[#86BCBE]/20 text-[#86BCBE] hover:text-[#86BCBE]"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(item)}
                        className="hover:bg-[#D97D54]/20 text-[#D97D54] hover:text-[#D97D54]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + (onView || onEdit || onDelete ? 1 : 0)}
                className="text-center py-8 text-[#314755]/70"
              >
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
