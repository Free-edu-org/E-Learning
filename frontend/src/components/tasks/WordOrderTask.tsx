import { Task } from '../../App';
import { Button } from '../ui/button';
import { ArrowDown, ArrowUp, X } from 'lucide-react';

interface WordOrderTaskProps {
  task: Task;
  value: string[];
  onChange: (value: string[]) => void;
}

export function WordOrderTask({ task, value, onChange }: WordOrderTaskProps) {
  const selectedWords = value || [];
  const availableWords = task.words?.filter(word => !selectedWords.includes(word)) || [];

  const addWord = (word: string) => {
    onChange([...selectedWords, word]);
  };

  const removeWord = (index: number) => {
    const newWords = [...selectedWords];
    newWords.splice(index, 1);
    onChange(newWords);
  };

  const moveWord = (index: number, direction: 'up' | 'down') => {
    const newWords = [...selectedWords];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newWords[index], newWords[targetIndex]] = [newWords[targetIndex], newWords[index]];
    onChange(newWords);
  };

  return (
    <div className="space-y-6">
      {/* Selected words area */}
      <div className="min-h-[120px] p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
        <div className="text-sm mb-2 text-gray-600">Twoje zdanie:</div>
        {selectedWords.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            Przeciągnij słowa tutaj lub kliknij poniżej
          </div>
        ) : (
          <div className="space-y-2">
            {selectedWords.map((word, index) => (
              <div key={index} className="flex items-center gap-2 bg-white p-2 rounded shadow-sm">
                <span className="flex-1">{word}</span>
                <div className="flex gap-1">
                  {index > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveWord(index, 'up')}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                  )}
                  {index < selectedWords.length - 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveWord(index, 'down')}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeWord(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available words */}
      <div>
        <div className="text-sm mb-2 text-gray-600">Dostępne słowa:</div>
        <div className="flex flex-wrap gap-2">
          {availableWords.map((word, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => addWord(word)}
            >
              {word}
            </Button>
          ))}
          {availableWords.length === 0 && (
            <div className="text-gray-400">Wszystkie słowa zostały użyte</div>
          )}
        </div>
      </div>
    </div>
  );
}
