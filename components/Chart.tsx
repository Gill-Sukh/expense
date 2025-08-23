import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface ChartProps {
  data: Array<{ 
    name: string; 
    value?: number; 
    color?: string; 
    expenses?: number; 
    income?: number 
  }>;
  type: 'pie' | 'bar' | 'line' | 'dual-line';
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#10b981', '#6366f1', '#a855f7'
];

const CHART_COLORS = {
  success: ['#22c55e', '#16a34a', '#15803d'],
  danger: ['#ef4444', '#dc2626', '#b91c1c'],
  primary: ['#3b82f6', '#2563eb', '#1d4ed8'],
  warning: ['#f59e0b', '#d97706', '#b45309'],
  purple: ['#8b5cf6', '#7c3aed', '#6d28d9']
};

export default function Chart({ 
  data, 
  type, 
  height = 300, 
  colors = DEFAULT_COLORS 
}: ChartProps) {
  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
          />
          <Tooltip 
            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'dual-line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              `₹${value.toLocaleString()}`, 
              name === 'expenses' ? 'Expenses' : 'Income'
            ]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="#ef4444" 
            strokeWidth={3}
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
            name="Expenses"
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#22c55e" 
            strokeWidth={3}
            dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
            name="Income"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Default bar chart
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis 
          dataKey="name" 
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(value) => `₹${value.toLocaleString()}`}
        />
        <Tooltip 
          formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Bar 
          dataKey="value" 
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
