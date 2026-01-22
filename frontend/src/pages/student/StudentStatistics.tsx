import { useState } from 'react';
import { LessonResult, User } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, TrendingUp, CheckCircle, Award, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

interface StudentStatisticsProps {
  studentId: string;
  onBack: () => void;
}

// Mock data
const mockStudent: User = {
  id: 'student-1',
  name: 'Jan Kowalski',
  email: 'jan.kowalski@example.com',
  role: 'student',
  avatar: '👨‍🎓',
  nickname: 'Janek'
};

const mockResults: LessonResult[] = [
  {
    lessonId: 'lesson-1',
    studentId: 'student-1',
    answers: [],
    score: 8,
    maxScore: 10,
    percentage: 80,
    completedAt: new Date('2024-01-15')
  },
  {
    lessonId: 'lesson-2',
    studentId: 'student-1',
    answers: [],
    score: 9,
    maxScore: 10,
    percentage: 90,
    completedAt: new Date('2024-01-20')
  },
  {
    lessonId: 'lesson-3',
    studentId: 'student-1',
    answers: [],
    score: 7,
    maxScore: 10,
    percentage: 70,
    completedAt: new Date('2024-01-25')
  }
];

const progressData = [
  { date: '15.01', percentage: 80, lesson: 'Present Simple' },
  { date: '20.01', percentage: 90, lesson: 'Modal Verbs' },
  { date: '25.01', percentage: 70, lesson: 'Word Order' }
];

const skillsData = [
  { skill: 'Gramatyka', score: 85 },
  { skill: 'Słownictwo', score: 75 },
  { skill: 'Szyk wyrazów', score: 90 },
  { skill: 'Czasy', score: 80 },
  { skill: 'Rozumienie', score: 88 }
];

const lessonTypeData = [
  { type: 'Rozsypanki', score: 85, count: 12 },
  { type: 'Luki', score: 78, count: 15 },
  { type: 'Wybór', score: 92, count: 10 }
];

export function StudentStatistics({ studentId, onBack }: StudentStatisticsProps) {
  const [student] = useState<User>(mockStudent);
  const [results] = useState<LessonResult[]>(mockResults);

  const averagePercentage = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
  const completedLessons = results.length;
  const totalPoints = results.reduce((sum, r) => sum + r.score, 0);
  const maxPossiblePoints = results.reduce((sum, r) => sum + r.maxScore, 0);
  const bestResult = Math.max(...results.map(r => r.percentage));
  const recentTrend = results.length >= 2 
    ? results[results.length - 1].percentage - results[results.length - 2].percentage 
    : 0;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1>Statystyki ucznia</h1>
              <p className="text-gray-600">Szczegółowa analiza postępów</p>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <Card className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                <AvatarFallback className="text-4xl bg-gradient-to-br from-indigo-100 to-purple-100">
                  {student.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2>{student.name}</h2>
                  {student.nickname && (
                    <Badge variant="outline">"{student.nickname}"</Badge>
                  )}
                </div>
                <p className="text-gray-600">{student.email}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-600">
                  {Math.round(averagePercentage)}%
                </div>
                <div className="text-sm text-gray-600">Średni wynik</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <CardDescription>Zdobyte punkty</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-600" />
                {totalPoints}/{maxPossiblePoints}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Najlepszy wynik</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6 text-purple-600" />
                {bestResult}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Ostatnia zmiana</CardDescription>
              <CardTitle className={`flex items-center gap-2 ${recentTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="w-6 h-6" />
                {recentTrend >= 0 ? '+' : ''}{recentTrend}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Progress over time */}
          <Card>
            <CardHeader>
              <CardTitle>Postępy w czasie</CardTitle>
              <CardDescription>Wyniki z kolejnych lekcji</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-bold">{payload[0].payload.lesson}</p>
                            <p className="text-sm text-gray-600">{payload[0].payload.date}</p>
                            <p className="text-indigo-600 font-bold">{payload[0].value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Skills radar */}
          <Card>
            <CardHeader>
              <CardTitle>Mocne i słabe strony</CardTitle>
              <CardDescription>Analiza umiejętności</CardDescription>
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

        {/* Task type performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Wyniki według typu zadań</CardTitle>
            <CardDescription>Jak uczeń radzi sobie z różnymi typami ćwiczeń</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lessonTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historia wyników</CardTitle>
            <CardDescription>Szczegółowe wyniki z poszczególnych lekcji</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progressData.reverse().map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.lesson}</div>
                    <div className="text-sm text-gray-600">{item.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">{item.percentage}%</div>
                    <div className="text-sm text-gray-600">
                      {Math.round(item.percentage / 10)}/10 pkt
                    </div>
                  </div>
                  <Badge 
                    variant={item.percentage >= 80 ? 'default' : item.percentage >= 60 ? 'secondary' : 'outline'}
                  >
                    {item.percentage >= 80 ? 'Świetnie!' : item.percentage >= 60 ? 'Dobrze' : 'Do poprawy'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
