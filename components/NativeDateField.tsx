import { useState } from 'react';
import { Platform, StyleProp, StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../data/colors';

type NativeDateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  max?: string;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: object;
};

function parseDateString(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function formatDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function NativeDateField({
  value,
  onChange,
  max,
  containerStyle,
  textStyle,
}: NativeDateFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateString(value);
  const maximumDate = max ? parseDateString(max) : undefined;

  const handleChange = (event: DateTimePickerEvent, nextDate?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed' || !nextDate) return;
    onChange(formatDateString(nextDate));
  };

  if (Platform.OS === 'web') {
    return (
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={C.textLight}
        style={[styles.textInput, textStyle]}
      />
    );
  }

  return (
    <View style={containerStyle}>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen((prev) => !prev)} activeOpacity={0.8}>
        <Text style={[styles.triggerText, textStyle]}>{value}</Text>
        <Ionicons name={open && Platform.OS === 'ios' ? 'chevron-up' : 'calendar-outline'} size={16} color={C.textMuted} />
      </TouchableOpacity>
      {open ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    fontSize: 14,
    color: C.text,
    padding: 0,
  },
  trigger: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  triggerText: {
    fontSize: 14,
    color: C.text,
  },
});
