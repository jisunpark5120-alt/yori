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
      description: `${type === 'link' ? '링크' : type === 'text' ? '텍스트' : '이미지'}를 확인하고 있어요.`,
    });

    await new Promise((r) => setTimeout(r, 1500));

    const isRecipe = checkIfRecipe(type, value);

    if (!isRecipe) {
      toast({
        title: '레시피가 아닌 것 같아요 🤔',
        description: '요리 관련 내용이 아닌 것 같아요. 레시피 링크나 내용을 다시 확인해주세요!',
        variant: 'destructive',
      });
      return;
    }

    // Generate a new recipe card from the input
    const newRecipe = generateRecipeFromInput(type, value);
    setRecipes((prev) => [newRecipe, ...prev]);

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
      const recipeHosts = ['youtube.com', 'youtu.be', 'instagram.com', 'x.com', 'twitter.com', 'blog.naver.com', 'hygall.com', 'tiktok.com'];
      try {
        const url = new URL(value.startsWith('http') ? value : `https://${value}`);
        return recipeHosts.some((h) => url.hostname.includes(h));
      } catch {
        return false;
      }
    }
    return true;
  };

  const generateRecipeFromInput = (type: string, value: string): Recipe => {
    const id = Date.now().toString();
    const now = new Date().toISOString().slice(0, 10);

    if (type === 'link') {
      let source: Recipe['source'] = '기타';
      let emoji = '🍽';
      let title = '링크에서 가져온 레시피';
      try {
        const url = new URL(value.startsWith('http') ? value : `https://${value}`);
        const host = url.hostname;
        if (host.includes('youtube') || host.includes('youtu.be')) { source = 'YouTube'; emoji = '📺'; title = 'YouTube 레시피'; }
        else if (host.includes('x.com') || host.includes('twitter')) { source = 'X (Twitter)'; emoji = '🐦'; title = 'X에서 발견한 레시피'; }
        else if (host.includes('instagram')) { source = 'Instagram'; emoji = '📸'; title = 'Instagram 레시피'; }
        else if (host.includes('blog.naver') || host.includes('tistory')) { source = '블로그'; emoji = '📝'; title = '블로그 레시피'; }
        else if (host.includes('hygall')) { source = '기타'; emoji = '💬'; title = '커뮤니티 레시피'; }
      } catch { /* keep defaults */ }

      return {
        id,
        title,
        emoji,
        source,
        sourceUrl: value,
        ingredients: ['원본 링크를 확인해주세요'],
        instructions: ['원본 링크에서 레시피 내용을 확인할 수 있어요.'],
        replies: [],
        pinned: false,
        liked: false,
        createdAt: now,
      };
    }

    if (type === 'image') {
      return {
        id,
        title: '사진으로 추가한 레시피',
        emoji: '📷',
        source: '직접입력',
        ingredients: ['사진을 확인해주세요'],
        instructions: ['첨부한 사진에서 레시피를 확인할 수 있어요.'],
        replies: [],
        pinned: false,
        liked: false,
        createdAt: now,
      };
    }

    // Text input — try to extract a title from first line
    const firstLine = value.split('\n')[0].slice(0, 30);
    return {
      id,
      title: firstLine || '직접 입력한 레시피',
      emoji: '📝',
      source: '직접입력',
      ingredients: ['직접 내용을 정리해주세요'],
      instructions: [value],
      replies: [],
      pinned: false,
      liked: false,
      createdAt: now,
      rawContent: value,
    };
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
