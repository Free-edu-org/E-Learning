import { Task } from '../../App';
import { Input } from '../ui/input';

interface FillGapTaskProps {
  task: Task;
  value: string;
  onChange: (value: string) => void;
}

export function FillGapTask({ task, value, onChange }: FillGapTaskProps) {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-lg">{task.question}</p>
      </div>
      <div className="space-y-2">
        <label>Twoja odpowiedź:</label>
        <Input
          placeholder="Wpisz odpowiedź..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-lg"
        />
      </div>
    </div>
  );
}
