import { useState, useEffect } from 'react';
import { mockRecipes } from '@/data/mockRecipes';
import RecipeCard from '@/components/RecipeCard';
import AddRecipeDialog from '@/components/AddRecipeDialog';
import RecipeDetailOverlay from '@/components/RecipeDetailOverlay';
import { useToast } from '@/hooks/use-toast';
import { Recipe } from '@/types/recipe';

const Index = () => {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/recipes')
      .then((res) => res.json())
      .then((data) => {
        if (data.recipes && data.recipes.length > 0) {
          setRecipes(data.recipes);
        } else {
          // Migration from localStorage if KV is empty
          try {
            const saved = localStorage.getItem('yori_recipes');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed && parsed.length > 0) {
                setRecipes(parsed);
                fetch('/api/recipes', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ recipes: parsed }),
                });
              }
            }
          } catch (e) {}
        }
        setIsLoaded(true);
      })
      .catch((e) => {
        console.error(e);
        setIsLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('yori_recipes', JSON.stringify(recipes));
      fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipes }),
      }).catch(console.error);
    }
  }, [recipes, isLoaded]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [analyzingTasks, setAnalyzingTasks] = useState<{ id: string; type: string; progress: number; message: string }[]>([]);

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

  const handleAddReply = (recipeId: string, reply: import('@/types/recipe').RecipeReply) => {
    setRecipes((prev) => prev.map((r) => r.id === recipeId ? { ...r, replies: [reply, ...r.replies] } : r));
  };

  const handleAdd = async (type: string, value: string | string[]) => {
    const taskId = Date.now().toString() + Math.random().toString();
    setAnalyzingTasks((prev) => [{ id: taskId, type }, ...prev]);
    
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

      const reader = response.body?.getReader();
      if (!reader) throw new Error('안정적인 데이터 스트리밍이 지원되지 않습니다.');

      const decoder = new TextDecoder();
      let done = false;
      let finalResult = null;
      let buffer = '';

      while (!done) {
        const { value: chunk, done: readerDone } = await reader.read();
        done = readerDone;
        if (chunk) {
          buffer += decoder.decode(chunk, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          
          for (const msg of parts) {
            if (msg.startsWith('data: ')) {
              const dataStr = msg.substring(6).trim();
              if (!dataStr) continue;
              const data = JSON.parse(dataStr);
              if (data.error) throw new Error(data.error);
              setAnalyzingTasks((prev) => prev.map(t => t.id === taskId ? { ...t, progress: data.progress, message: data.message } : t));
              if (data.progress === 100 && data.result) finalResult = data.result;
            }
          }
        }
      }

      if (!finalResult) throw new Error('서버 연결이 중단되어 결과를 수신하지 못했습니다.');

      const resultsArray = Array.isArray(finalResult) ? finalResult : [finalResult];
      
      const newRecipes: Recipe[] = resultsArray.map((resItem, idx) => ({
        id: Date.now().toString() + idx.toString(),
        title: resItem.title || 'AI 분석 레시피',
        emoji: resItem.emoji || '🍽',
        source: type === 'link' ? '기타' : '직접입력',
        sourceUrl: typeof value === 'string' && type === 'link' ? value : undefined,
        cookingTime: resItem.cookingTime,
        ingredients: resItem.ingredients || ['재료 파싱 실패'],
        instructions: resItem.instructions || ['내용 파싱 실패'],
        replies: [],
        pinned: false,
        liked: false,
        createdAt: new Date().toISOString().slice(0, 10),
        rawContent: typeof value === 'string' && type === 'text' ? value : undefined,
      }));

      if (newRecipes.length === 0) {
        toast({
          title: '레시피를 찾지 못했어요 😢',
          description: '제공된 내용에서 상세한 요리 레시피를 발견할 수 없었습니다.',
        });
      } else {
        setRecipes((prev) => [...newRecipes, ...prev]);
        toast({
          title: `${newRecipes.length}개의 레시피 추가됨 ✨`,
          description: 'AI가 레시피를 성공적으로 분석하여 추가했어요!',
        });
      }
    } catch (error: any) {
      toast({
        title: '레시피 분석 실패 😵',
        description: error.message || '요리 관련 내용이 아니거나 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingTasks((prev) => prev.filter((t) => t.id !== taskId));
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
          {analyzingTasks.map((task) => (
            <div key={task.id} className="w-full bg-card rounded-2xl p-4 shadow-sm border border-primary/50 flex flex-col justify-center h-[88px] relative overflow-hidden transition-all duration-300">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-500 ease-out" 
                style={{ width: `${task.progress}%` }} 
              />
              <div className="relative z-10 flex flex-col items-center">
                <p className="text-sm font-bold text-primary flex items-center gap-2 mb-1">
                  <span className="animate-spin text-lg">⏳</span> 
                  {task.progress}% 완료
                </p>
                <p className="text-xs font-medium text-muted-foreground animate-pulse">
                  {task.message}
                </p>
              </div>
            </div>
          ))}
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
          onAddReply={(reply) => handleAddReply(selectedRecipe.id, reply)}
        />
      )}
    </div>
  );
};

export default Index;
