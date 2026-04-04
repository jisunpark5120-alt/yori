import { useState } from 'react';
import { mockRecipes } from '@/data/mockRecipes';
import RecipeCard from '@/components/RecipeCard';
import AddRecipeDialog from '@/components/AddRecipeDialog';
import RecipeDetailOverlay from '@/components/RecipeDetailOverlay';
import { useToast } from '@/hooks/use-toast';
import { Recipe } from '@/types/recipe';

const Index = () => {
  const { toast } = useToast();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const sortedRecipes = [...mockRecipes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleAdd = async (type: string, value: string) => {
    // Show analyzing toast
    toast({
      title: '분석 중... 🔍',
      description: `${type === 'link' ? '링크' : type === 'text' ? '텍스트' : '이미지'}를 확인하고 있어요.`,
    });

    // Simulate AI analysis delay
    await new Promise((r) => setTimeout(r, 1500));

    // Simple heuristic: check if content looks like a recipe
    const isRecipe = checkIfRecipe(type, value);

    if (!isRecipe) {
      toast({
        title: '레시피가 아닌 것 같아요 🤔',
        description: '요리 관련 내용이 아닌 것 같아요. 레시피 링크나 내용을 다시 확인해주세요!',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '레시피 추가됨 ✨',
      description: '레시피가 성공적으로 분석되었어요!',
    });
  };

  const checkIfRecipe = (type: string, value: string): boolean => {
    if (type === 'text') {
      const recipeKeywords = ['재료', '만드는', '레시피', '요리', '볶', '끓', '굽', '썰', '넣', '큰술', '작은술', 'ml', 'g', '분', '컵', '소금', '설탕', '간장', '기름'];
      const lowerValue = value.toLowerCase();
      const matchCount = recipeKeywords.filter((kw) => lowerValue.includes(kw)).length;
      return matchCount >= 2;
    }
    if (type === 'link') {
      // For links, basic URL validation — actual AI analysis would happen server-side
      const recipeHosts = ['youtube.com', 'youtu.be', 'instagram.com', 'x.com', 'twitter.com', 'blog.naver.com', 'hygall.com', 'tiktok.com'];
      try {
        const url = new URL(value.startsWith('http') ? value : `https://${value}`);
        return recipeHosts.some((h) => url.hostname.includes(h));
      } catch {
        return false;
      }
    }
    return true; // images pass through for now
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
              onClick={() => setSelectedRecipe(recipe)}
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
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
};

export default Index;
