import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C } from '../data/colors';

type Props = {
  rating: number;
  size?: number;
  onChange?: (n: number) => void;
};

export default function StarRating({ rating, size = 14, onChange }: Props) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.row}>
      {stars.map((n) => {
        const filled = rating >= n;
        const half = !filled && rating >= n - 0.5;
        const star = (
          <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={filled ? '#E0A558' : 'none'}
              stroke={filled || half ? '#E0A558' : C.borderStrong}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {half && (
              <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77V2z" fill="#E0A558" />
            )}
          </Svg>
        );
        if (onChange) {
          return (
            <TouchableOpacity key={n} onPress={() => onChange(n)}>
              {star}
            </TouchableOpacity>
          );
        }
        return <View key={n}>{star}</View>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
