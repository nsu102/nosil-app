import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { C } from '../data/colors';

type Props = { levels: Record<string, number> };

export default function ConcernRadar({ levels }: Props) {
  const entries = Object.entries(levels || {}).filter(([, v]) => typeof v === 'number' && v > 0);
  if (entries.length < 3) return null;

  const size = 280;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const radius = 78;
  const n = entries.length;
  const maxLevel = 5;

  const point = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  };

  const rings = [1, 2, 3, 4, 5].map((level) => {
    const r = (radius * level) / maxLevel;
    const points = Array.from({ length: n }, (_, i) => {
      const p = point(i, r);
      return p.x + ',' + p.y;
    }).join(' ');
    return { level, points };
  });

  const axes = Array.from({ length: n }, (_, i) => point(i, radius));

  const dataPoints = entries.map(([, v], i) => point(i, (radius * Math.min(v, maxLevel)) / maxLevel));
  const dataString = dataPoints.map((p) => p.x + ',' + p.y).join(' ');

  const labelRadius = radius + 28;
  const labels = entries.map(([name, v], i) => {
    const p = point(i, labelRadius);
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    let anchor: 'middle' | 'start' | 'end' = 'middle';
    if (Math.cos(angle) > 0.3) anchor = 'start';
    else if (Math.cos(angle) < -0.3) anchor = 'end';
    return { name, level: v, x: p.x, y: p.y, anchor };
  });

  const severityLabel = (v: number) => {
    if (v >= 5) return '심함';
    if (v >= 4) return '뚜렷함';
    if (v >= 3) return '보통';
    if (v >= 2) return '약함';
    return '경미';
  };

  return (
    <View style={styles.card}>
      <Svg width={size} height={size + 16} viewBox={`0 0 ${size} ${size + 16}`} style={styles.chart}>
        {rings.map((r) => (
          <Polygon key={r.level} points={r.points} fill="none" stroke={C.border} strokeWidth="0.5" />
        ))}
        {axes.map((p, i) => (
          <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={C.border} strokeWidth="0.5" />
        ))}
        <Polygon points={dataString} fill={C.accent} fillOpacity={0.18} stroke={C.accent} strokeWidth="1.5" strokeLinejoin="round" />
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r="3" fill={C.accent} />
        ))}

        {labels.map((l, i) => (
          <G key={i}>
            <SvgText x={l.x} y={l.y - 6} fontSize="10" fill={C.text} textAnchor={l.anchor} alignmentBaseline="middle" fontWeight="500">
              {l.name}
            </SvgText>
            <SvgText x={l.x} y={l.y + 8} fontSize="9" fill={C.textMuted} textAnchor={l.anchor} alignmentBaseline="middle">
              {`${l.level}${'\u2215'}5 · ${severityLabel(l.level)}`}
            </SvgText>
          </G>
        ))}
      </Svg>
      <View style={styles.legend}>
        <Text style={styles.legendText}>1 경미</Text>
        <Text style={styles.legendText}>·</Text>
        <Text style={styles.legendText}>3 보통</Text>
        <Text style={styles.legendText}>·</Text>
        <Text style={styles.legendText}>5 심함</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, paddingTop: 18, paddingHorizontal: 12, paddingBottom: 14 },
  chart: { alignSelf: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 8 },
  legendText: { fontSize: 9, color: C.textLight },
});
