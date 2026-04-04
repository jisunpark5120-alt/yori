import { useState } from 'react';
import { mockRecipes } from '@/data/mockRecipes';
import RecipeCard from '@/components/RecipeCard';
import AddRecipeDialog from '@/components/AddRecipeDialog';
import RecipeDetailOverlay from '@/components/RecipeDetailOverlay';
import { useToast } from '@/hooks/use-toast';
import { Recipe } from '@/types/recipe';

const Index = () => {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) || null;

  const sortedRecipes = [...recipes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleTogglePin = (id: string) => {
    const recipe = recipes.find((r) => r.id === id);
    if (recipe) updateRecipe(id, { pinned: !recipe.pinned });
  };

  const handleToggleLike = (id: string) => {
    const recipe = recipes.find((r) => r.id === id);
    if (recipe) updateRecipe(id, { liked: !recipe.liked });
  };

  const handleDelete = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setSelectedRecipeId(null);
  };

  const handleAdd = async (type: string, value: string) => {
    toast({
      title: '분석 중... 🔍',
      description: `${type === 'link' ? '링크' : type === 'text' ? '텍스트' : '이미지'}를 AI가 꼼꼼히 확인하고 있어요.`,
    });

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value })
      });

      if (!response.ok) {
        let errMsg = 'AI 분석에 실패했습니다.';
        try {
          const errData = await response.json();
          if (errData.error) errMsg = errData.error;
        } catch(e) {}
        throw new Error(errMsg);
      }

      const result = await response.json();
      
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        title: result.title || 'AI 분석 레시피',
        emoji: result.emoji || '🍽',
        source: type === 'link' ? '기타' : '직접입력',
        sourceUrl: type === 'link' ? value : undefined,
        cookingTime: result.cookingTime,
        ingredients: result.ingredients || ['재료 파싱 실패'],
        instructions: result.instructions || ['내용 파싱 실패'],
        replies: [],
        pinned: false,
        liked: false,
        createdAt: new Date().toISOString().slice(0, 10),
        rawContent: type === 'text' ? value : undefined,
      };

      setRecipes((prev) => [newRecipe, ...prev]);

      toast({
        title: '레시피 추가됨 ✨',
        description: 'AI가 레시피를 성공적으로 분석했어요!',
      });
    } catch (error: any) {
      toast({
        title: '레시피 분석 실패 😵',
        description: error.message || '요리 관련 내용이 아니거나 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };





  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 px-4 py-4 border-b border-border/50">
        <div className="container max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">🍳 요리조리함</h1>
          <p className="text-xs text-muted-foreground mt-0.5">나만의 레시피 보관함</p>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4">
        <div className="space-y-3">
          {sortedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => setSelectedRecipeId(recipe.id)}
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

      {selectedRecipe && (
        <RecipeDetailOverlay
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipeId(null)}
          onTogglePin={() => handleTogglePin(selectedRecipe.id)}
          onToggleLike={() => handleToggleLike(selectedRecipe.id)}
          onDelete={() => handleDelete(selectedRecipe.id)}
        />
      )}
    </div>
  );
};

export default Index;
