import { useState } from 'react';
import { User, Lesson } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Plus, LogOut, BookOpen, BarChart3, Edit, Eye, Users, UsersRound, Power, PowerOff } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { Switch } from './ui/switch';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
  onCreateLesson: () => void;
  onEditLesson: (lessonId: string) => void;
  onViewResults: (lessonId: string) => void;
  onManageStudents: () => void;
  onManageGroups: () => void;
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
    isActive: true,
    groupIds: ['group-1']
  },
  {
    id: 'lesson-2',
    title: 'Modal Verbs',
    topic: 'Czasowniki modalne',
    grammarRules: 'Czasowniki modalne (can, could, may, might, must, should) wyrażają możliwość, zdolność, pozwolenie...',
    tasks: [],
    teacherId: 'teacher-1',
    createdAt: new Date('2024-01-20'),
    isActive: true,
    groupIds: ['group-1', 'group-2']
  },
  {
    id: 'lesson-3',
    title: 'Word Order in Questions',
    topic: 'Szyk wyrazów w pytaniach',
    grammarRules: 'W pytaniach w języku angielskim czasownik posiłkowy stoi przed podmiotem...',
    tasks: [],
    teacherId: 'teacher-1',
    createdAt: new Date('2024-01-25'),
    isActive: false,
    groupIds: []
  }
];

export function TeacherDashboard({ user, onLogout, onCreateLesson, onEditLesson, onViewResults, onManageStudents, onManageGroups }: TeacherDashboardProps) {
  const [lessons, setLessons] = useState<Lesson[]>(mockLessons);

  const handleToggleLessonActive = (lessonId: string) => {
    setLessons(lessons.map(lesson => 
      lesson.id === lessonId 
        ? { ...lesson, isActive: !lesson.isActive }
        : lesson
    ));
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) {
      toast.success(
        lesson.isActive 
          ? `Lekcja "${lesson.title}" została dezaktywowana` 
          : `Lekcja "${lesson.title}" została aktywowana`
      );
    }
  };

  const activeLessonsCount = lessons.filter(l => l.isActive).length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{user.avatar}</div>
            <div>
              <h1>Witaj, {user.name}!</h1>
              <p className="text-gray-600">Panel nauczyciela</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Wyloguj
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>Liczba lekcji</CardDescription>
              <CardTitle>{lessons.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Aktywne lekcje</CardDescription>
              <CardTitle className="text-green-600">{activeLessonsCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Aktywni uczniowie</CardDescription>
              <CardTitle>24</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Średnia wyników</CardDescription>
              <CardTitle>78%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button onClick={onManageStudents} variant="outline" className="h-auto py-6">
            <div className="flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-indigo-600" />
              <div>
                <div className="font-bold">Zarządzaj uczniami</div>
                <div className="text-xs text-gray-600">Dodaj, edytuj, archiwizuj</div>
              </div>
            </div>
          </Button>
          <Button onClick={onManageGroups} variant="outline" className="h-auto py-6">
            <div className="flex flex-col items-center gap-2">
              <UsersRound className="w-8 h-8 text-purple-600" />
              <div>
                <div className="font-bold">Zarządzaj grupami</div>
                <div className="text-xs text-gray-600">Twórz grupy, przydzielaj uczniów</div>
              </div>
            </div>
          </Button>
          <Button onClick={onCreateLesson} variant="outline" className="h-auto py-6">
            <div className="flex flex-col items-center gap-2">
              <Plus className="w-8 h-8 text-green-600" />
              <div>
                <div className="font-bold">Utwórz lekcję</div>
                <div className="text-xs text-gray-600">Nowa lekcja z zadaniami</div>
              </div>
            </div>
          </Button>
        </div>

        {/* Lessons */}
        <div className="flex items-center justify-between mb-6">
          <h2>Moje lekcje</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className={`hover:shadow-lg transition-shadow ${!lesson.isActive ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    </div>
                    <CardDescription>{lesson.topic}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={lesson.isActive ? 'default' : 'secondary'}>
                        {lesson.isActive ? 'Aktywna' : 'Nieaktywna'}
                      </Badge>
                      <Switch
                        checked={lesson.isActive}
                        onCheckedChange={() => handleToggleLessonActive(lesson.id)}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Utworzona: {lesson.createdAt.toLocaleDateString('pl-PL')}
                  </div>
                  {lesson.groupIds && lesson.groupIds.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Grupy: {lesson.groupIds.length}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditLesson(lesson.id)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edytuj
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewResults(lesson.id)}
                      className="flex-1"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Wyniki
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}