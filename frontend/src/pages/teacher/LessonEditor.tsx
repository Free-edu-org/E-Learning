import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Task, TaskType } from '@/types';

export function LessonEditor() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [grammarRules, setGrammarRules] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const addTask = (type: TaskType) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      type,
      question: '',
      correctAnswer: type === 'word-order' ? [] : '',
      options: type === 'multiple-choice' ? ['', '', '', ''] : undefined,
      words: type === 'word-order' ? [] : undefined
    };
    setEditingTask(newTask);
  };

  const saveTask = () => {
    if (editingTask) {
      const existingIndex = tasks.findIndex(t => t.id === editingTask.id);
      if (existingIndex >= 0) {
        const newTasks = [...tasks];
        newTasks[existingIndex] = editingTask;
        setTasks(newTasks);
      } else {
        setTasks([...tasks, editingTask]);
      }
      setEditingTask(null);
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const saveLesson = () => {
    // Mock save
    console.log('Saving lesson:', { title, topic, grammarRules, tasks });
    navigate('/teacher');
  };

  const getTaskTypeName = (type: TaskType) => {
    switch (type) {
      case 'word-order': return 'Rozsypanka';
      case 'fill-gap': return 'Uzupełnij lukę';
      case 'multiple-choice': return 'Wybór odpowiedzi';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/teacher')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót
            </Button>
            <h1>{lessonId ? 'Edytuj lekcję' : 'Utwórz nową lekcję'}</h1>
          </div>
          <Button onClick={saveLesson}>
            <Save className="w-4 h-4 mr-2" />
            Zapisz lekcję
          </Button>
        </div>

        {/* Basic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Podstawowe informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label>Tytuł lekcji</label>
              <Input
                placeholder="np. Present Simple vs Present Continuous"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label>Temat</label>
              <Input
                placeholder="np. Czasy teraźniejsze"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label>Zasady gramatyczne (widoczne z boku podczas rozwiązywania)</label>
              <Textarea
                placeholder="Opisz zasady gramatyczne..."
                value={grammarRules}
                onChange={(e) => setGrammarRules(e.target.value)}
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Zadania ({tasks.length})</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => addTask('word-order')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Rozsypanka
                </Button>
                <Button size="sm" variant="outline" onClick={() => addTask('fill-gap')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Luka
                </Button>
                <Button size="sm" variant="outline" onClick={() => addTask('multiple-choice')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Wybór
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.map((task, index) => (
              <div key={task.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{getTaskTypeName(task.type)}</Badge>
                    <span>Zadanie {index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-600">{task.question || 'Brak pytania'}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingTask(task)}>
                    Edytuj
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteTask(task.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Brak zadań. Dodaj pierwsze zadanie używając przycisków powyżej.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Editor Modal */}
        {editingTask && (
          <Card className="mb-6 border-2 border-indigo-500">
            <CardHeader>
              <CardTitle>
                Edytuj zadanie: {getTaskTypeName(editingTask.type)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label>Pytanie/Polecenie</label>
                <Input
                  placeholder="np. Arrange the words in correct order"
                  value={editingTask.question}
                  onChange={(e) => setEditingTask({ ...editingTask, question: e.target.value })}
                />
              </div>

              {editingTask.type === 'word-order' && (
                <>
                  <div className="space-y-2">
                    <label>Słowa (oddzielone przecinkami)</label>
                    <Input
                      placeholder="np. I, am, learning, English"
                      value={Array.isArray(editingTask.words) ? editingTask.words.join(', ') : ''}
                      onChange={(e) => setEditingTask({
                        ...editingTask,
                        words: e.target.value.split(',').map(w => w.trim())
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Poprawna kolejność (oddzielone przecinkami)</label>
                    <Input
                      placeholder="np. I, am, learning, English"
                      value={Array.isArray(editingTask.correctAnswer) ? editingTask.correctAnswer.join(', ') : ''}
                      onChange={(e) => setEditingTask({
                        ...editingTask,
                        correctAnswer: e.target.value.split(',').map(w => w.trim())
                      })}
                    />
                  </div>
                </>
              )}

              {editingTask.type === 'fill-gap' && (
                <div className="space-y-2">
                  <label>Poprawna odpowiedź</label>
                  <Input
                    placeholder="np. have been"
                    value={editingTask.correctAnswer as string}
                    onChange={(e) => setEditingTask({ ...editingTask, correctAnswer: e.target.value })}
                  />
                </div>
              )}

              {editingTask.type === 'multiple-choice' && (
                <>
                  {editingTask.options?.map((option, index) => (
                    <div key={index} className="space-y-2">
                      <label>Odpowiedź {index + 1}</label>
                      <Input
                        placeholder={`Odpowiedź ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(editingTask.options || [])];
                          newOptions[index] = e.target.value;
                          setEditingTask({ ...editingTask, options: newOptions });
                        }}
                      />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <label>Numer poprawnej odpowiedzi (1-4)</label>
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      placeholder="np. 1"
                      value={editingTask.correctAnswer as string}
                      onChange={(e) => setEditingTask({ ...editingTask, correctAnswer: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button onClick={saveTask}>Zapisz zadanie</Button>
                <Button variant="outline" onClick={() => setEditingTask(null)}>Anuluj</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
