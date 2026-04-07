import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const COLORS = ['hsl(215, 70%, 35%)', 'hsl(45, 90%, 55%)', 'hsl(142, 72%, 29%)', 'hsl(0, 72%, 51%)', 'hsl(199, 89%, 48%)', 'hsl(280, 60%, 50%)'];

export default function StatistiquesPage() {
  const { marches, bonsCommande } = useData();

  // Par exercice
  const byYear = marches.reduce((acc, m) => {
    acc[m.exercice] = (acc[m.exercice] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const yearData = Object.entries(byYear).map(([name, value]) => ({ name, value }));

  // Montant par exercice
  const montantByYear = marches.reduce((acc, m) => {
    acc[m.exercice] = (acc[m.exercice] || 0) + m.montantTotal;
    return acc;
  }, {} as Record<string, number>);
  const montantYearData = Object.entries(montantByYear).map(([name, value]) => ({ name, value: value / 1000000 }));

  // Par type
  const byType = marches.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  // Par statut
  const byStatus = marches.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const statusData = Object.entries(byStatus).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  // Montant par imputation
  const byImputation = marches.reduce((acc, m) => {
    acc[m.imputationBudgetaire] = (acc[m.imputationBudgetaire] || 0) + m.montantTotal;
    return acc;
  }, {} as Record<string, number>);
  const imputationData = Object.entries(byImputation).map(([name, value]) => ({ name, value: value / 1000000 }));

  const totalMontant = marches.reduce((s, m) => s + m.montantTotal, 0);
  const totalEngage = marches.reduce((s, m) => s + (m.engagement?.montantTotalEngage || 0), 0);
  const totalLiquide = marches.reduce((s, m) => s + m.operations.reduce((ss, o) => ss + o.montant, 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="card-shadow">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Montant total des marchés</p>
            <p className="text-2xl font-bold mt-1">{(totalMontant / 1000000).toFixed(2)} M DH</p>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Total engagé</p>
            <p className="text-2xl font-bold mt-1">{(totalEngage / 1000000).toFixed(2)} M DH</p>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Total liquidé</p>
            <p className="text-2xl font-bold mt-1">{(totalLiquide / 1000000).toFixed(2)} M DH</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="card-shadow">
          <CardHeader><CardTitle className="text-base">Nombre de marchés par exercice</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(215, 70%, 35%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader><CardTitle className="text-base">Répartition par type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader><CardTitle className="text-base">Répartition par statut</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader><CardTitle className="text-base">Montant par imputation (M DH)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={imputationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(45, 90%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
