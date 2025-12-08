import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'Jan', receita: 4000, despesa: 2400 },
  { name: 'Fev', receita: 3000, despesa: 1398 },
  { name: 'Mar', receita: 2000, despesa: 9800 },
  { name: 'Abr', receita: 2780, despesa: 3908 },
  { name: 'Mai', receita: 1890, despesa: 4800 },
  { name: 'Jun', receita: 2390, despesa: 3800 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#D97D54]/95 backdrop-blur-sm border border-[#F9FAFF]/20 rounded-lg p-4 shadow-lg">
        <p className="text-sm font-medium text-[#F9FAFF] mb-2">{payload[0].payload.name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[#F9FAFF]/80">{entry.name}:</span>
            <span className="font-semibold text-[#F9FAFF]">
              R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => (
  <div className="flex items-center justify-center gap-6 mt-4">
    {payload.map((entry: any, index: number) => (
      <div key={index} className="flex items-center gap-2">
        <div 
          className="w-4 h-4 rounded" 
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-sm font-medium text-[#F9FAFF]">{entry.value}</span>
      </div>
    ))}
  </div>
);

export function FinancialChart() {
  return (
    <Card className="col-span-2 bg-[#D97D54]">
      <CardHeader>
        <CardTitle className="text-[#F9FAFF]">Resultado Anual</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="receitaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F9FAFF" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#F9FAFF" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="despesaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F9FAFF" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#F9FAFF" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#F9FAFF" 
              opacity={0.2}
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#F9FAFF', fontSize: 12 }}
              axisLine={{ stroke: '#F9FAFF', opacity: 0.3 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#F9FAFF', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFF', opacity: 0.1 }} />
            <Legend content={<CustomLegend />} />
            <Bar 
              dataKey="receita" 
              fill="url(#receitaGradient)" 
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
            <Bar 
              dataKey="despesa" 
              fill="url(#despesaGradient)" 
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
