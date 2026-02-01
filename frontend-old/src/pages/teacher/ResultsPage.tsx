import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Award, Eye, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
  },
  {
    lessonId: 'lesson-1',
    studentId: 'student-2',
    answers: [],
    score: 7,
    maxScore: 10,
    percentage: 70,
    completedAt: new Date('2024-01-20')
  },
  {
    lessonId: 'lesson-1',
    studentId: 'student-3',
    answers: [],
    score: 9,
    maxScore: 10,
    percentage: 90,
    completedAt: new Date('2024-01-21')
  },
  {
    lessonId: 'lesson-1',
    studentId: 'student-4',
    answers: [],
    score: 6,
    maxScore: 10,
    percentage: 60,
    completedAt: new Date('2024-01-21')
  },
  {
    lessonId: 'lesson-1',
    studentId: 'student-5',
    answers: [],
    score: 10,
    maxScore: 10,
    percentage: 100,
    completedAt: new Date('2024-01-22')
  }
];

const studentNames: Record<string, string> = {
  'student-1': 'Jan Kowalski',
  'student-2': 'Anna Nowak',
  'student-3': 'Piotr Wiśniewski',
  'student-4': 'Maria Kowalczyk',
  'student-5': 'Tomasz Wójcik'
};

export function ResultsPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const [results] = useState<LessonResult[]>(mockResults);

  const averagePercentage = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
  const completedStudents = results.length;
  const topScore = Math.max(...results.map(r => r.percentage));

  const chartData = results.map(result => ({
    name: studentNames[result.studentId] || result.studentId,
    percentage: result.percentage,
    score: result.score
  })).sort((a, b) => b.percentage - a.percentage);

  const distributionData = [
    { range: '0-20%', count: results.filter(r => r.percentage < 20).length },
    { range: '20-40%', count: results.filter(r => r.percentage >= 20 && r.percentage < 40).length },
    { range: '40-60%', count: results.filter(r => r.percentage >= 40 && r.percentage < 60).length },
    { range: '60-80%', count: results.filter(r => r.percentage >= 60 && r.percentage < 80).length },
    { range: '80-100%', count: results.filter(r => r.percentage >= 80).length }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/teacher')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1>Wyniki lekcji</h1>
              <p className="text-gray-600">Present Simple vs Present Continuous ({lessonId ?? 'lesson-1'})</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>Średni wynik</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                {Math.round(averagePercentage)}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Uczniowie, którzy ukończyli</CardDescription>
              <CardTitle>{completedStudents}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Najlepszy wynik</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-600" />
                {topScore}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Wyniki uczniów</CardTitle>
              <CardDescription>Porównanie wyników procentowych</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rozkład wyników</CardTitle>
              <CardDescription>Liczba uczniów w przedziałach procentowych</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle>Szczegółowe wyniki</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div>{studentNames[result.studentId] || result.studentId}</div>
                    <div className="text-sm text-gray-600">
                      Ukończono: {result.completedAt.toLocaleDateString('pl-PL')}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Punkty</div>
                      <div>{result.score} / {result.maxScore}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Procent</div>
                      <div className={`${result.percentage >= 70 ? 'text-green-600' : result.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {result.percentage}%
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/teacher/students/${result.studentId}/statistics`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Zobacz profil
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
