import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LessonResult } from '@/types';

// Mock data
const mockResults: LessonResult[] = [
  {
    lessonId: 'lesson-1',
    studentId: 'student-1',
    answers: [],
    score: 8,
    maxScore: 10,
    percentage: 80,
    completedAt: new Date('2024-01-20')
  }
];

const progressData = [
  { date: '15.01', percentage: 60 },
  { date: '20.01', percentage: 80 },
];

const skillsData = [
  { skill: 'Gramatyka', score: 85 },
  { skill: 'Słownictwo', score: 75 },
  { skill: 'Szyk wyrazów', score: 90 },
  { skill: 'Czasy', score: 80 },
];

export function StudentResults() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results] = useState<LessonResult[]>(mockResults);

  const averagePercentage = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
  const completedLessons = results.length;
  const totalPoints = results.reduce((sum, r) => sum + r.score, 0);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/student')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1>Twoje postępy</h1>
              <p className="text-gray-600">Przegląd wyników i statystyk</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>Ukończone lekcje</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                {completedLessons}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Średni wynik</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                {Math.round(averagePercentage)}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Zdobyte punkty</CardDescription>
              <CardTitle>{totalPoints}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Twój postęp w czasie</CardTitle>
              <CardDescription>Wyniki z kolejnych lekcji</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Umiejętności</CardTitle>
              <CardDescription>Twoje mocne i słabe strony</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={skillsData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Achievement badges */}
        <Card>
          <CardHeader>
            <CardTitle>Twoje osiągnięcia</CardTitle>
            <CardDescription>Zdobyte odznaki</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-6 text-center bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                <div className="text-4xl mb-2">🏆</div>
                <div>Pierwsza lekcja</div>
              </div>
              <div className="p-6 text-center bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-4xl mb-2">⭐</div>
                <div>80% w lekcji</div>
              </div>
              <div className="p-6 text-center bg-gray-100 rounded-lg opacity-50">
                <div className="text-4xl mb-2">🎯</div>
                <div>5 lekcji z rzędu</div>
              </div>
              <div className="p-6 text-center bg-gray-100 rounded-lg opacity-50">
                <div className="text-4xl mb-2">🔥</div>
                <div>100% wynik</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
