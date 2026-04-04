import { Recipe, RecipeReply } from '@/types/recipe';
import { highlightText } from '@/lib/highlightRecipeText';
import { ArrowLeft, Pin, Heart, Trash2, ExternalLink, MessageCircle, Camera, X, RefreshCw } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getSubstitutes } from '@/data/ingredientSubstitutes';

interface RecipeDetailOverlayProps {
  recipe: Recipe;
  onClose: () => void;
  onTogglePin: () => void;
  onToggleLike: () => void;
  onDelete: () => void;
  onAddReply: (reply: RecipeReply) => void;
}

const RecipeDetailOverlay = ({ recipe, onClose, onTogglePin, onToggleLike, onDelete, onAddReply }: RecipeDetailOverlayProps) => {
  const [replyText, setReplyText] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setReplyImagePreview(url);
    }
  };

  const removeImage = () => {
    setReplyImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRecord = () => {
    if (!replyText.trim() && !replyImagePreview) return;
    onAddReply({
      id: Date.now().toString(),
      text: replyText.trim(),
      imageUrl: replyImagePreview || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setReplyText('');
    setReplyImagePreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 px-4 py-3 flex items-center justify-between border-b border-border/50">
        <button onClick={onClose} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={onTogglePin} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <Pin className={`w-5 h-5 ${recipe.pinned ? 'text-secondary fill-secondary' : 'text-muted-foreground'}`} />
          </button>
          <button onClick={onToggleLike} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <Heart className={`w-5 h-5 ${recipe.liked ? 'text-destructive fill-destructive' : 'text-muted-foreground'}`} />
          </button>
          <button onClick={onDelete} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <Trash2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6 pb-20">
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
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {recipe.ingredients.map((item, i) => {
              const sub = getSubstitutes(item);
              const checked = checkedIngredients.has(i);

              const content = (
                <div
                  className={`flex items-start gap-2 text-sm rounded-lg p-1.5 transition-colors ${
                    checked ? 'text-muted-foreground line-through' : 'text-foreground/90'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleIngredient(i)}
                    className="mt-0.5 shrink-0 rounded-md border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="leading-snug">{highlightText(item)}</span>
                  {sub && <RefreshCw className="w-3 h-3 shrink-0 mt-1 text-muted-foreground/60" />}
                </div>
              );

              if (sub) {
                return (
                  <Popover key={i}>
                    <PopoverTrigger asChild>
                      <button className="w-full text-left hover:bg-muted/50 rounded-lg transition-colors">
                        {content}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3 rounded-xl" side="top" align="start">
                      <p className="text-xs font-semibold text-foreground mb-2">
                        🔄 <span className="text-secondary">{sub.name}</span> 대체 재료
                      </p>
                      <ul className="space-y-1">
                        {sub.alternatives.map((alt, j) => (
                          <li key={j} className="text-xs text-foreground/80 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                            {alt}
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>
                );
              }

              return <div key={i}>{content}</div>;
            })}
          </div>
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

        {/* Cooking Log */}
        <section className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 animate-fade-in">
          <h2 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            요리 일지 ({recipe.replies.length})
          </h2>
          {recipe.replies.length > 0 ? (
            <div className="space-y-2">
              {recipe.replies.map((reply) => (
                <div key={reply.id} className="bg-muted rounded-xl p-3 text-sm">
                  {reply.imageUrl && (
                    <img
                      src={reply.imageUrl}
                      alt="요리 사진"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                  <p className="text-foreground/90">{reply.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{reply.createdAt}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">아직 기록이 없어요</p>
          )}

          {replyImagePreview && (
            <div className="relative mt-3 inline-block">
              <img
                src={replyImagePreview}
                alt="첨부 사진"
                className="h-20 w-20 object-cover rounded-xl border border-border"
              />
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground w-5 h-5 rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors shrink-0"
            >
              <Camera className="w-4 h-4 text-muted-foreground" />
            </button>
            <Input
              placeholder="오늘의 요리 기록..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="rounded-xl text-sm"
            />
            <Button
              size="sm"
              onClick={handleRecord}
              disabled={!replyText.trim() && !replyImagePreview}
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

export default RecipeDetailOverlay;
