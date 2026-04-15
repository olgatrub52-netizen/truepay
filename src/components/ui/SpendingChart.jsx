import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1e30]/95 px-3 py-2 text-center shadow-xl backdrop-blur-md">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-[14px] font-semibold text-white">${payload[0].value}</p>
    </div>
  )
}

export default function SpendingChart({ data }) {
  return (
    <div style={{ width: '100%', height: 80 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(148,163,184,0.6)', fontSize: 10, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#0ea5e9"
            strokeWidth={1.5}
            fill="url(#spendGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#0ea5e9', stroke: 'none' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
