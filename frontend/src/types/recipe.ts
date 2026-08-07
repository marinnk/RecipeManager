export type RecipeInput = {
  title: string;
  url?: string;
  thumbnailUrl?: string;
  memo?: string;
  tags: string[];
};

export type Recipe = {
  id: number;
  title: string;
  url: string | null;
  thumbnailUrl: string | null;
  memo: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ApiErrorBody = {
  error: string;
  message: string;
};
