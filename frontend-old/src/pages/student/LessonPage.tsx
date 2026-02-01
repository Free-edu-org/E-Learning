import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FillGapTask } from '@/components/tasks/FillGapTask';
import { MultipleChoiceTask } from '@/components/tasks/MultipleChoiceTask';
import { WordOrderTask } from '@/components/tasks/WordOrderTask';
import type { StudentAnswer } from '@/types';

// Mock lesson data
const mockLesson = {
  id: 'lesson-1',
  title: 'Present Simple vs Present Continuous',
  topic: 'Czasy teraźniejsze',
  grammarRules: `**Present Simple:**
- Używamy do opisywania rutynowych czynności i stałych prawd
- Struktura: podmiot + czasownik (+ s/es dla he/she/it)
- Przykład: I play tennis every Sunday.

**Present Continuous:**
- Używamy do opisywania czynności odbywających się w momencie mówienia
- Struktura: podmiot + am/is/are + czasownik-ing
- Przykład: I am playing tennis now.`,
  tasks: [
    {
      id: 'task-1',
      type: 'word-order' as const,
      question: 'Arrange the words to make a correct sentence:',
      words: ['plays', 'She', 'piano', 'the', 'every', 'day'],
      correctAnswer: ['She', 'plays', 'the', 'piano', 'every', 'day']
    },
    {
      id: 'task-2',
      type: 'fill-gap' as const,
      question: 'Fill in the gap with the correct form: I _____ (watch) TV right now.',
      correctAnswer: 'am watching'
    },
    {
      id: 'task-3',
      type: 'multiple-choice' as const,
      question: 'Which sentence is correct?',
      options: [
        'He go to school every day.',
        'He goes to school every day.',
        'He going to school every day.',
        'He is go to school every day.'
      ],
      correctAnswer: '2'
    },
    {
      id: 'task-4',
      type: 'word-order' as const,
      question: 'Arrange the words to make a question:',
      words: ['you', 'Do', 'English', 'speak', '?'],
      correctAnswer: ['Do', 'you', 'speak', 'English', '?']
    }
  ]
};

export function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string | string[]>('');
  const [showResults, setShowResults] = useState(false);

  const resolvedLessonId = lessonId ?? mockLesson.id;
  const lesson = { ...mockLesson, id: resolvedLessonId };
  const currentTask = lesson.tasks[currentTaskIndex];
  const progress = ((currentTaskIndex + 1) / lesson.tasks.length) * 100;

  const checkAnswer = (userAnswer: string | string[], correctAnswer: string | string[]) => {
    if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
      return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    }
    return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
  };

  const handleNext = () => {
    const isCorrect = checkAnswer(currentAnswer, currentTask.correctAnswer);
    const newAnswer: StudentAnswer = {
      taskId: currentTask.id,
      answer: currentAnswer,
      isCorrect
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    if (currentTaskIndex < lesson.tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
      setCurrentAnswer('');
    } else {
      setShowResults(true);
    }
  };

  const handleFinish = () => {
    navigate('/student');
  };

  if (showResults) {
    const score = answers.filter(a => a.isCorrect).length;
    const maxScore = answers.length;
    const percentage = Math.round((score / maxScore) * 100);

    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
              </div>
              <CardTitle>Gratulacje! Ukończyłeś lekcję!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">{score}</div>
                  <div className="text-gray-600">Poprawne odpowiedzi</div>
                </div>
                <div className="p-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">{maxScore}</div>
                  <div className="text-gray-600">Wszystkie zadania</div>
                </div>
                <div className="p-6 bg-indigo-100 rounded-lg">
                  <div className="text-3xl mb-2">{percentage}%</div>
                  <div className="text-gray-600">Wynik</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3>Twoje odpowiedzi:</h3>
                {lesson.tasks.map((task, index) => {
                  const answer = answers[index];
                  return (
                    <div key={task.id} className={`p-4 rounded-lg ${answer.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2">Zadanie {index + 1}: {task.question}</div>
                          <div className="text-sm">
                            <div>Twoja odpowiedź: <strong>{Array.isArray(answer.answer) ? answer.answer.join(' ') : answer.answer}</strong></div>
                            {!answer.isCorrect && (
                              <div className="text-green-700 mt-1">
                                Poprawna odpowiedź: <strong>{Array.isArray(task.correctAnswer) ? task.correctAnswer.join(' ') : task.correctAnswer}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          {answer.isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white">✗</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button onClick={handleFinish} className="w-full">
                Powrót do panelu
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1>{lesson.title}</h1>
                <div className="text-gray-600">
                  Zadanie {currentTaskIndex + 1} z {lesson.tasks.length}
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{currentTask.question}</CardTitle>
              </CardHeader>
              <CardContent>
                {currentTask.type === 'word-order' && (
                  <WordOrderTask
                    task={currentTask}
                    value={currentAnswer as string[]}
                    onChange={setCurrentAnswer}
                  />
                )}
                
                {currentTask.type === 'fill-gap' && (
                  <FillGapTask
                    task={currentTask}
                    value={currentAnswer as string}
                    onChange={setCurrentAnswer}
                  />
                )}

                {currentTask.type === 'multiple-choice' && (
                  <MultipleChoiceTask
                    task={currentTask}
                    value={currentAnswer as string}
                    onChange={setCurrentAnswer}
                  />
                )}

                <div className="flex justify-end mt-6">
                  <Button onClick={handleNext} disabled={!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)}>
                    {currentTaskIndex < lesson.tasks.length - 1 ? (
                      <>
                        Dalej
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      'Zakończ test'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grammar rules sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Zasady gramatyczne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm whitespace-pre-line text-gray-700">
                  {lesson.grammarRules}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
