import { Button } from '@/components/ui/button';
import type { Task } from '@/types';

interface MultipleChoiceTaskProps {
  task: Task;
  value: string;
  onChange: (value: string) => void;
}

export function MultipleChoiceTask({ task, value, onChange }: MultipleChoiceTaskProps) {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-lg">{task.question}</p>
      </div>
      <div className="space-y-3">
        {task.options?.map((option, index) => (
          <Button
            key={index}
            variant={value === String(index + 1) ? 'default' : 'outline'}
            className="w-full justify-start text-left h-auto py-4 px-6"
            onClick={() => onChange(String(index + 1))}
          >
            <span className="mr-4 flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              {index + 1}
            </span>
            <span className="flex-1">{option}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
