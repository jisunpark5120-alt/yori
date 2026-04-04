import { useParams, useNavigate } from 'react-router-dom';
import { mockRecipes } from '@/data/mockRecipes';
import { highlightText } from '@/lib/highlightRecipeText';
import { ArrowLeft, Pin, Heart, Trash2, ExternalLink, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recipe = mockRecipes.find((r) => r.id === id);
  const [replyText, setReplyText] = useState('');

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">레시피를 찾을 수 없어요 😢</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 px-4 py-3 flex items-center justify-between border-b border-border/50">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-xl hover:bg-muted transition-colors">
            <Pin className={`w-5 h-5 ${recipe.pinned ? 'text-secondary fill-secondary' : 'text-muted-foreground'}`} />
          </button>
          <button className="p-2 rounded-xl hover:bg-muted transition-colors">
            <Heart className={`w-5 h-5 ${recipe.liked ? 'text-destructive fill-destructive' : 'text-muted-foreground'}`} />
          </button>
          <button className="p-2 rounded-xl hover:bg-muted transition-colors">
            <Trash2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <div className="text-center animate-fade-in">
          <span className="text-5xl">{recipe.emoji}</span>
          <h1 className="text-xl font-bold text-foreground mt-3">{recipe.title}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            {recipe.cookingTime && (
              <span className="bg-highlight-time text-foreground text-xs px-3 py-1 rounded-full font-medium">
                ⏱ {recipe.cookingTime}
              </span>
            )}
            <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
              {recipe.source}
            </span>
          </div>
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              원본 보기
            </a>
          )}
        </div>

        {/* Ingredients */}
        <section className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 animate-fade-in">
          <h2 className="font-semibold text-foreground mb-3 text-sm">🧂 재료</h2>
          <ul className="space-y-1.5">
            {recipe.ingredients.map((item, i) => (
              <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">•</span>
                <span>{highlightText(item)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Instructions */}
        <section className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 animate-fade-in">
          <h2 className="font-semibold text-foreground mb-3 text-sm">👩‍🍳 만드는 법</h2>
          <ol className="space-y-3">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="text-sm text-foreground/90 flex gap-3">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{highlightText(step)}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Replies */}
        <section className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 animate-fade-in">
          <h2 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            요리 일지 ({recipe.replies.length})
          </h2>
          {recipe.replies.length > 0 ? (
            <div className="space-y-2">
              {recipe.replies.map((reply) => (
                <div key={reply.id} className="bg-muted rounded-xl p-3 text-sm">
                  <p className="text-foreground/90">{reply.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{reply.createdAt}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">아직 기록이 없어요</p>
          )}
          <div className="flex gap-2 mt-3">
            <Input
              placeholder="오늘의 요리 기록..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="rounded-xl text-sm"
            />
            <Button
              size="sm"
              disabled={!replyText.trim()}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              기록
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RecipeDetail;
