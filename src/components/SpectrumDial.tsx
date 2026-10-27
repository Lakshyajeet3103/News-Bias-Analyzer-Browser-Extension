import { motion } from 'motion/react';
import { scaleLinear } from 'd3-scale';

interface Props { value: number; band: number; label: string; compact?: boolean; }
const polar = (angle: number, radius: number) => ({ x: 150 + Math.cos(angle) * radius, y: 132 + Math.sin(angle) * radius });
function arcPath(start: number, end: number, radius: number) { const a = polar(start, radius); const b = polar(end, radius); return `M${a.x},${a.y} A${radius},${radius} 0 0 1 ${b.x},${b.y}`; }
export function SpectrumDial({ value, band, label, compact = false }: Props) {
  const angle = scaleLinear().domain([-1, 1]).range([Math.PI, Math.PI * 2]).clamp(true)(value);
  const start = scaleLinear().domain([-1, 1]).range([Math.PI, Math.PI * 2]).clamp(true)(value - band);
  const end = scaleLinear().domain([-1, 1]).range([Math.PI, Math.PI * 2]).clamp(true)(value + band);
  return <div className="dial" role="img" aria-label={`US-centric lean estimate: ${label}, confidence band plus or minus ${band.toFixed(2)}`}>
    <svg viewBox="0 0 300 166" aria-hidden="true">
      <defs><linearGradient id="spectrum"><stop stopColor="#4B4FA8"/><stop offset=".5" stopColor="#8A8577"/><stop offset="1" stopColor="#B7791F"/></linearGradient></defs>
      <path d={arcPath(Math.PI, Math.PI * 2, 101)} fill="none" stroke="var(--rule)" strokeWidth="20" strokeLinecap="round"/>
      <path d={arcPath(Math.PI, Math.PI * 2, 101)} fill="none" stroke="url(#spectrum)" strokeWidth="13" strokeLinecap="round"/>
      <path d={arcPath(start, end, 117)} fill="none" stroke="var(--ink)" strokeOpacity=".2" strokeWidth="9" strokeLinecap="round"/>
      <motion.g initial={{ rotate: -90 }} animate={{ rotate: (angle * 180 / Math.PI) - 270 }} transition={{ type:'spring', stiffness:90, damping:17 }} style={{ transformOrigin:'150px 132px' }}>
        <path d="M150 132 L145 38 L150 28 L155 38 Z" fill="var(--ink)"/><circle cx="150" cy="132" r="7" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3"/>
      </motion.g>
      <text x="150" y="151" textAnchor="middle" className="dial-label">{label}</text>
      <text x="150" y="164" textAnchor="middle" className="dial-band">±{band.toFixed(2)} · US-CENTRIC AXIS</text>
      {!compact && <><text x="35" y="144" className="dial-band">LEFT</text><text x="240" y="144" className="dial-band">RIGHT</text></>}
    </svg>
  </div>;
}
