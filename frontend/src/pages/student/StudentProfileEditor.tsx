import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers/AuthProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User } from '@/types';

// Mock student data
const mockStudent: User = {
  id: 'student-1',
  name: 'Jan Kowalski',
  email: 'jan.kowalski@example.com',
  role: 'student',
  avatar: '👨‍🎓',
  nickname: 'Janek'
};

const availableAvatars = [
  '👨‍🎓', '👩‍🎓', '🧑‍🎓', '👨', '👩', '🧑', 
  '👦', '👧', '🧒', '👶', '🐱', '🐶', 
  '🐼', '🐨', '🦊', '🐸', '🦁', '🐯',
  '🌟', '⭐', '🎯', '🎨', '🎭', '🎪'
];

export function StudentProfileEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initialStudent = user ?? mockStudent;
  const [student, setStudent] = useState<User>(initialStudent);
  const [nickname, setNickname] = useState(student.nickname || '');
  const [selectedAvatar, setSelectedAvatar] = useState(student.avatar || '👤');
  const [motto, setMotto] = useState('Uczę się angielskiego z pasją! 📚');

  const handleSave = () => {
    const updatedStudent: User = {
      ...student,
      nickname,
      avatar: selectedAvatar
    };
    
    setStudent(updatedStudent);
    toast.success('Twój profil został zaktualizowany!');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/student')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1>Personalizuj swój profil</h1>
              <p className="text-gray-600">Dostosuj swój wygląd w aplikacji</p>
            </div>
          </div>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Zapisz
          </Button>
        </div>

        {/* Profile Preview */}
        <Card className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle>Podgląd profilu</CardTitle>
            <CardDescription>Tak będziesz widoczny/a w aplikacji</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarFallback className="text-5xl bg-gradient-to-br from-indigo-100 to-purple-100">
                  {selectedAvatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="mb-1">{student.name}</h2>
                {nickname && (
                  <p className="text-lg text-gray-700 mb-1">"{nickname}"</p>
                )}
                <p className="text-sm text-gray-600 italic">{motto}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avatar Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Wybierz swój avatar</CardTitle>
            <CardDescription>Kliknij na emoji, który Ci się podoba</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-3">
              {availableAvatars.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`
                    w-12 h-12 text-3xl rounded-lg transition-all hover:scale-110
                    ${selectedAvatar === avatar 
                      ? 'bg-indigo-600 ring-4 ring-indigo-300 shadow-lg' 
                      : 'bg-gray-100 hover:bg-gray-200'
                    }
                  `}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nickname */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Twój pseudonim</CardTitle>
            <CardDescription>Krótka nazwa, która będzie wyświetlana obok Twojego imienia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="nickname">Pseudonim</Label>
              <Input
                id="nickname"
                placeholder="np. Janek, Gracz123, SuperStudent"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
              />
              <p className="text-sm text-gray-600">
                {nickname.length}/20 znaków
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Motto */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Twoje motto</CardTitle>
            <CardDescription>Krótkie motto lub ulubione powiedzenie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="motto">Motto</Label>
              <Input
                id="motto"
                placeholder="np. Uczę się angielskiego z pasją!"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                maxLength={50}
              />
              <p className="text-sm text-gray-600">
                {motto.length}/50 znaków
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Color Theme (future feature) */}
        <Card>
          <CardHeader>
            <CardTitle>Motyw kolorystyczny</CardTitle>
            <CardDescription>Wybierz swój ulubiony kolor (wkrótce dostępne)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-3">
              {[
                'bg-indigo-500',
                'bg-purple-500',
                'bg-pink-500',
                'bg-red-500',
                'bg-orange-500',
                'bg-yellow-500',
                'bg-green-500',
                'bg-teal-500',
                'bg-blue-500',
                'bg-cyan-500',
                'bg-gray-500',
                'bg-slate-500'
              ].map((color, index) => (
                <button
                  key={index}
                  className={`w-12 h-12 rounded-lg ${color} hover:scale-110 transition-all opacity-50 cursor-not-allowed`}
                  disabled
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
