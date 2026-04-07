import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, LogIn, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, user, createPassword } = useAuth();
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(matricule, password)) {
      toast.error('Matricule ou mot de passe incorrect');
      return;
    }
    toast.success('Connexion réussie');
  };

  const handleCreatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    createPassword(newPassword);
    toast.success('Mot de passe créé avec succès');
  };

  if (user?.isFirstLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md card-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Première connexion</CardTitle>
            <CardDescription>
              Bienvenue {user.prenom} {user.nom}. Veuillez créer votre mot de passe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">Créer le mot de passe</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md card-shadow">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Gestion Marché</CardTitle>
          <CardDescription>DP Justice Meknès — Veuillez vous connecter</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matricule">Matricule</Label>
              <Input id="matricule" placeholder="Votre numéro matricule" value={matricule} onChange={e => setMatricule(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" placeholder="Votre mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full gap-2">
              <LogIn className="h-4 w-4" /> Se connecter
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Démo: ADMIN / admin123 ou 10001 / pass123
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
