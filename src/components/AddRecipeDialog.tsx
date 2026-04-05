import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Link, Image, FileText, X } from 'lucide-react';

type InputType = 'link' | 'image' | 'text';

interface AddRecipeDialogProps {
  onAdd: (type: InputType, value: string | string[]) => void;
}

const AddRecipeDialog = ({ onAdd }: AddRecipeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [inputType, setInputType] = useState<InputType>('link');
  const [value, setValue] = useState('');
  const [images, setImages] = useState<{ preview: string; base64: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (inputType === 'image') {
      if (images.length === 0) return;
      onAdd('image', images.map(img => img.base64));
    } else {
      if (!value.trim()) return;
      onAdd(inputType, value.trim());
    }
    resetState();
    setOpen(false);
  };

  const resetState = () => {
    setValue('');
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;
    
    const sliceCount = 5 - images.length;
    const filesToProcess = files.slice(0, sliceCount);

    const newImages = await Promise.all(filesToProcess.map(file => new Promise<{preview: string, base64: string}>((resolve) => {
      const preview = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (!reader.result) {
          resolve({ preview, base64: '' });
          return;
        }
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_SIZE = 1200;
          
          if (width > height && width > MAX_SIZE) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve({ preview, base64: canvas.toDataURL('image/jpeg', 0.8) });
          } else {
            resolve({ preview, base64: reader.result as string });
          }
        };
        img.onerror = () => {
          resolve({ preview, base64: reader.result as string });
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve({ preview, base64: '' });
      reader.readAsDataURL(file);
    })));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const tabs: { type: InputType; icon: React.ReactNode; label: string }[] = [
    { type: 'link', icon: <Link className="w-4 h-4" />, label: '링크' },
    { type: 'image', icon: <Image className="w-4 h-4" />, label: '이미지' },
    { type: 'text', icon: <FileText className="w-4 h-4" />, label: '텍스트' },
  ];

  const isSubmitDisabled = inputType === 'image' ? images.length === 0 : !value.trim();

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
              onClick={() => { setInputType(tab.type); setValue(''); setImages([]); }}
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
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {images.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative shrink-0">
                        <img
                          src={img.preview}
                          alt="레시피 이미지 미리보기"
                          className="h-28 w-28 object-cover rounded-xl border border-border"
                        />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-28 w-28 shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors"
                      >
                        <Plus className="w-8 h-8 mb-1 opacity-50" />
                        <span className="text-xs">추가 ({images.length}/5)</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">탭해서 레시피 사진을 올려주세요</p>
                  <p className="text-xs mt-1 opacity-60">최대 5장 (JPG, PNG 등)</p>
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
