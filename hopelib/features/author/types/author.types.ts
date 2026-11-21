export interface Author {
  id: string;
  name: string;
  biography?: string | null;
}

export interface AuthorBookItem {
  id: string;
  title: string;
  bookUrl?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
}

export interface AuthorDetail {
  id: string;
  name: string;
  biography?: string | null;
  books: AuthorBookItem[];
}

export interface CreateAuthorDto {
  name: string;
  biography?: string;
}

export interface UpdateAuthorDto {
  name?: string;
  biography?: string;
}

export interface AuthorFeedback {
  type: "success" | "error" | "info";
  message: string;
}
