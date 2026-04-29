export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export interface TableFilterField {
  key: string;
  label: string;
  placeholder?: string;
}

export interface PageChangeEvent {
  page: number;
  limit: number;
}

export interface SortChangeEvent {
  key: string;
  direction: 'asc' | 'desc';
}
