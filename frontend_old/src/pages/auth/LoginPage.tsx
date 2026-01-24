import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User } from '@/types';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const handleTeacherLogin = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Replace mock login with API call when backend auth is ready.
    // Mock login
    const user: User = {
      id: 'teacher-1',
      name: 'Pani Anna',
      role: 'teacher',
      avatar: '👩‍🏫'
    };
    login(user);
    navigate('/teacher');
  };

  const handleStudentLogin = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Replace mock login with API call when backend auth is ready.
    // Mock login
    const user: User = {
      id: 'student-1',
      name: 'Jan Kowalski',
      role: 'student',
      avatar: '👨‍🎓'
    };
    login(user);
    navigate('/student');
  };

  const handleDemoTeacher = () => {
    const user: User = {
      id: 'teacher-1',
      name: 'Pani Anna',
      role: 'teacher',
      avatar: '👩‍🏫',
      email: 'anna.nauczyciel@szkola.pl'
    };
    login(user);
    navigate('/teacher');
  };

  const handleDemoStudent = () => {
    const user: User = {
      id: 'student-1',
      name: 'Jan Kowalski',
      role: 'student',
      avatar: '👨‍🎓',
      nickname: 'Janek',
      email: 'jan.kowalski@example.com'
    };
    login(user);
    navigate('/student');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <BookOpen className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <CardTitle>English Learning Platform</CardTitle>
          <CardDescription>Zaloguj się, aby kontynuować</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Uczeń</TabsTrigger>
              <TabsTrigger value="teacher">Nauczyciel</TabsTrigger>
            </TabsList>
            
            <TabsContent value="student">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm mb-2">Szybkie logowanie demo:</p>
                  <Button onClick={handleDemoStudent} variant="outline" className="w-full">
                    Demo: Zaloguj jako Jan Kowalski (uczeń)
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Lub użyj formularza
                    </span>
                  </div>
                </div>
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="student-email">Email</label>
                    <Input
                      id="student-email"
                      type="email"
                      placeholder="uczen@szkola.pl"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="student-password">Hasło</label>
                    <Input
                      id="student-password"
                      type="password"
                      placeholder="••••••••"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Zaloguj się jako uczeń
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="teacher">
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm mb-2">Szybkie logowanie demo:</p>
                  <Button onClick={handleDemoTeacher} variant="outline" className="w-full">
                    Demo: Zaloguj jako Pani Anna (nauczyciel)
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Lub użyj formularza
                    </span>
                  </div>
                </div>
                <form onSubmit={handleTeacherLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="teacher-email">Email</label>
                    <Input
                      id="teacher-email"
                      type="email"
                      placeholder="nauczyciel@szkola.pl"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="teacher-password">Hasło</label>
                    <Input
                      id="teacher-password"
                      type="password"
                      placeholder="••••••••"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Zaloguj się jako nauczyciel
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
