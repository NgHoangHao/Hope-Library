export interface Category {
  id: string;
  name: string;
  description?: string | null;
}

export interface CategoryBookItem {
  id: string;
  title: string;
  bookUrl?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
}

export interface CategoryDetail {
  id: string;
  name: string;
  description?: string | null;
  books: CategoryBookItem[];
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
}

export interface CategoryFeedback {
  type: "success" | "error" | "info";
  message: string;
}
