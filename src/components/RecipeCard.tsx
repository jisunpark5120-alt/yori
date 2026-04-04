import { Recipe } from '@/types/recipe';
import { Pin, Heart, MessageCircle } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

const sourceLabel: Record<string, string> = {
  'YouTube': '유튜브',
  'X (Twitter)': 'X',
  'Instagram': '인스타',
  '블로그': '블로그',
  '직접입력': '직접입력',
  '기타': '기타',
};

const RecipeCard = ({ recipe, onClick }: RecipeCardProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in border border-border/50 active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl mt-0.5">{recipe.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-[15px]">
            {recipe.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            {recipe.cookingTime && (
              <span className="bg-highlight-time px-2 py-0.5 rounded-full font-medium">
                ⏱ {recipe.cookingTime}
              </span>
            )}
            <span className="bg-muted px-2 py-0.5 rounded-full">
              {sourceLabel[recipe.source] || recipe.source}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          {recipe.pinned && (
            <Pin className="w-4 h-4 text-secondary fill-secondary" />
          )}
          {recipe.liked && (
            <Heart className="w-4 h-4 text-destructive fill-destructive" />
          )}
          {recipe.replies.length > 0 && (
            <div className="flex items-center gap-0.5 text-muted-foreground">
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="text-[10px]">{recipe.replies.length}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default RecipeCard;
