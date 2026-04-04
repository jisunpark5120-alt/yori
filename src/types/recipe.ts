export type RecipeSource = 'YouTube' | 'X (Twitter)' | 'Instagram' | '블로그' | '직접입력' | '기타';

export interface RecipeReply {
  id: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  emoji: string;
  cookingTime?: string;
  source: RecipeSource;
  sourceUrl?: string;
  ingredients: string[];
  instructions: string[];
  replies: RecipeReply[];
  pinned: boolean;
  liked: boolean;
  createdAt: string;
  rawContent?: string;
}
