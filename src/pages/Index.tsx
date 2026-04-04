import { useNavigate } from 'react-router-dom';
import { mockRecipes } from '@/data/mockRecipes';
import RecipeCard from '@/components/RecipeCard';
import AddRecipeDialog from '@/components/AddRecipeDialog';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const sortedRecipes = [...mockRecipes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleAdd = (type: string, value: string) => {
    toast({
      title: '레시피 추가됨 ✨',
      description: `${type === 'link' ? '링크' : type === 'text' ? '텍스트' : '이미지'}가 분석 중이에요.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 px-4 py-4 border-b border-border/50">
        <div className="container max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">
            🍳 요리조리함
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">나만의 레시피 보관함</p>
        </div>
      </header>

      {/* Recipe List */}
      <main className="container max-w-lg mx-auto px-4 py-4">
        <div className="space-y-3">
          {sortedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => navigate(`/recipe/${recipe.id}`)}
            />
          ))}
        </div>

        {sortedRecipes.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <span className="text-4xl block mb-3">📒</span>
            <p className="text-sm">아직 레시피가 없어요</p>
            <p className="text-xs mt-1">아래 + 버튼으로 첫 레시피를 추가해보세요!</p>
          </div>
        )}
      </main>

      <AddRecipeDialog onAdd={handleAdd} />
    </div>
  );
};

export default Index;
