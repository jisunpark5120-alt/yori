import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Link, Image, FileText, X } from 'lucide-react';

type InputType = 'link' | 'image' | 'text';

interface AddRecipeDialogProps {
  onAdd: (type: InputType, value: string) => void;
}

const AddRecipeDialog = ({ onAdd }: AddRecipeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [inputType, setInputType] = useState<InputType>('link');
  const [value, setValue] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (inputType === 'image') {
      if (!imagePreview) return;
      onAdd('image', imagePreview);
    } else {
      if (!value.trim()) return;
      onAdd(inputType, value.trim());
    }
    resetState();
    setOpen(false);
  };

  const resetState = () => {
    setValue('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const tabs: { type: InputType; icon: React.ReactNode; label: string }[] = [
    { type: 'link', icon: <Link className="w-4 h-4" />, label: '링크' },
    { type: 'image', icon: <Image className="w-4 h-4" />, label: '이미지' },
    { type: 'text', icon: <FileText className="w-4 h-4" />, label: '텍스트' },
  ];

  const isSubmitDisabled = inputType === 'image' ? !imagePreview : !value.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        >
          <Plus className="w-6 h-6 text-primary-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">레시피 추가</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 justify-center mt-2">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              onClick={() => { setInputType(tab.type); setValue(''); removeImage(); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                inputType === tab.type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {inputType === 'link' && (
            <Input
              placeholder="레시피 링크를 붙여넣으세요 (유튜브, X, 블로그 등)"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="rounded-xl"
            />
          )}
          {inputType === 'image' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="레시피 이미지 미리보기"
                    className="w-full max-h-48 object-cover rounded-xl border border-border"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">탭해서 레시피 사진을 올려주세요</p>
                  <p className="text-xs mt-1 opacity-60">JPG, PNG 등</p>
                </button>
              )}
            </div>
          )}
          {inputType === 'text' && (
            <Textarea
              placeholder="레시피 내용을 직접 입력해주세요..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="rounded-xl min-h-[120px]"
            />
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="w-full rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
          >
            추가하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecipeDialog;
