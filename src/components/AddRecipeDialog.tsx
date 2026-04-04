import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Link, Image, FileText } from 'lucide-react';

type InputType = 'link' | 'image' | 'text';

interface AddRecipeDialogProps {
  onAdd: (type: InputType, value: string) => void;
}

const AddRecipeDialog = ({ onAdd }: AddRecipeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [inputType, setInputType] = useState<InputType>('link');
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!value.trim()) return;
    onAdd(inputType, value.trim());
    setValue('');
    setOpen(false);
  };

  const tabs: { type: InputType; icon: React.ReactNode; label: string }[] = [
    { type: 'link', icon: <Link className="w-4 h-4" />, label: '링크' },
    { type: 'image', icon: <Image className="w-4 h-4" />, label: '이미지' },
    { type: 'text', icon: <FileText className="w-4 h-4" />, label: '텍스트' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              onClick={() => { setInputType(tab.type); setValue(''); }}
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
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
              <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">이미지 업로드 (준비 중)</p>
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
            disabled={!value.trim()}
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
