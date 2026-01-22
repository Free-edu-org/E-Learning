import { useState } from 'react';
import { User, Lesson } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogOut, BookOpen, Play, TrendingUp, User as UserIcon, CheckCircle, Lock, Settings } from 'lucide-react';
import { Badge } from './ui/badge';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  onStartLesson: (lessonId: string) => void;
  onViewResults: () => void;
  onEditProfile: () => void;
}

interface LessonStatus {
  lessonId: string;
  completed: boolean;
  score?: number;
  percentage?: number;
}

// Mock data
const mockLessons: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Present Simple vs Present Continuous',
    topic: 'Czasy teraźniejsze',
    grammarRules: 'Present Simple używamy do opisywania rutynowych czynności...',
    tasks: [],
    teacherId: 'teacher-1',
    createdAt: new Date('2024-01-15'),
    isActive: true
  },
  {
    id: 'lesson-2',
    title: 'Modal Verbs',
    topic: 'Czasowniki modalne',
    grammarRules: 'Czasowniki modalne wyrażają możliwość, zdolność, pozwolenie...',
    tasks: [],
    teacherId: 'teacher-1',
    createdAt: new Date('2024-01-20'),
    isActive: true
  },
  {
    id: 'lesson-3',
    title: 'Word Order in Questions',
    topic: 'Szyk wyrazów w pytaniach',
    grammarRules: 'W pytaniach czasownik posiłkowy stoi przed podmiotem...',
    tasks: [],
    teacherId: 'teacher-1',
    createdAt: new Date('2024-01-25'),
    isActive: true
  }
];

export function StudentDashboard({ user, onLogout, onStartLesson, onViewResults, onEditProfile }: StudentDashboardProps) {
  const [lessons] = useState<Lesson[]>(mockLessons);
  const [lessonStatuses, setLessonStatuses] = useState<LessonStatus[]>([
    { lessonId: 'lesson-1', completed: true, score: 8, percentage: 80 },
    { lessonId: 'lesson-2', completed: false },
    { lessonId: 'lesson-3', completed: false }
  ]);

  const completedLessons = lessonStatuses.filter(s => s.completed).length;
  const averageScore = lessonStatuses
    .filter(s => s.percentage)
    .reduce((acc, s) => acc + (s.percentage || 0), 0) / (completedLessons || 1);

  const getLessonStatus = (lessonId: string) => {
    return lessonStatuses.find(s => s.lessonId === lessonId);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="text-4xl cursor-pointer" onClick={onEditProfile} title="Edytuj profil">
              {user.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1>Witaj, {user.name}!</h1>
                <Button variant="ghost" size="sm" onClick={onEditProfile}>
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-gray-600">Gotowy na naukę?</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Wyloguj
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>Ukończone lekcje</CardDescription>
              <CardTitle>{completedLessons} / {lessons.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Średni wynik</CardDescription>
              <CardTitle>{Math.round(averageScore)}%</CardTitle>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onViewResults}>
            <CardHeader>
              <CardDescription>Twoje postępy</CardDescription>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <CardTitle>Zobacz szczegóły</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Motivational Quote */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none">
          <CardHeader>
            <CardTitle>"Keep learning, keep growing!"</CardTitle>
            <CardDescription className="text-indigo-100">
              - Pani Anna 👩‍🏫
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Lessons */}
        <div className="mb-6">
          <h2>Dostępne lekcje</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => {
            const status = getLessonStatus(lesson.id);
            const isCompleted = status?.completed;

            return (
              <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <CardTitle className="text-lg">{lesson.title}</CardTitle>
                      </div>
                      <CardDescription>{lesson.topic}</CardDescription>
                    </div>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {isCompleted && status?.percentage && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm">Wynik</span>
                        <Badge variant="outline" className="bg-white">
                          {status.percentage}%
                        </Badge>
                      </div>
                    )}
                    
                    {isCompleted ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Ukończono
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => onStartLesson(lesson.id)}
                      >
                        Rozpocznij lekcję
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}