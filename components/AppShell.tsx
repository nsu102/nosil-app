import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { C } from '../data/colors';
import { F } from '../data/fonts';

type PageKey = 'home' | 'recommend' | 'hospitals' | 'encyclopedia' | 'daily' | 'record' | 'chat';

type AppShellProps = {
  children: ReactNode;
  currentPage: PageKey;
};

type SubHeaderProps = {
  title: string;
  onBack: () => void;
};

function HomeIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={C.text}
        strokeWidth={active ? 1.6 : 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="9 22 9 12 15 12 15 22"
        stroke={C.text}
        strokeWidth={active ? 1.6 : 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"
        stroke={C.text}
        strokeWidth={active ? 1.6 : 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={C.text}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={C.text} strokeWidth={1.2} />
    </Svg>
  );
}

function ChevronLeftIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="15 18 9 12 15 6"
        stroke={C.text}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2.5,
        borderColor: C.text,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Text
        style={{
          fontSize: size * 0.8,
          lineHeight: size * 0.8,
          letterSpacing: size > 40 ? -3 : -1.4,
          fontFamily: F.serifMedium,
          color: C.text,
          marginTop: size > 40 ? -4 : -1,
        }}
      >
        N
      </Text>
    </View>
  );
}

export function SubHeader({ title, onBack }: SubHeaderProps) {
  return (
    <View style={styles.subHeader}>
      <TouchableOpacity onPress={onBack} style={styles.subHeaderBack}>
        <ChevronLeftIcon />
      </TouchableOpacity>
      <Text style={styles.subHeaderTitle}>{title}</Text>
    </View>
  );
}

function BottomNav({ currentPage, bottomInset }: { currentPage: PageKey; bottomInset: number }) {
  const router = useRouter();
  const isHome = currentPage === 'home';
  const isChat = currentPage === 'chat';

  return (
    <View style={[styles.bottomNav, { paddingBottom: 12 + bottomInset }]}>
      <Pressable onPress={() => router.replace('/')} style={[styles.navButton, !isHome && styles.navButtonDim]}>
        <HomeIcon active={isHome} />
      </Pressable>
      <Pressable onPress={() => router.replace('/chat')} style={[styles.navButton, !isChat && styles.navButtonDim]}>
        <ChatIcon active={isChat} />
      </Pressable>
      <Pressable onPress={() => {}} style={[styles.navButton, styles.navButtonDim]}>
        <UserIcon />
      </Pressable>
    </View>
  );
}

export default function AppShell({ children, currentPage }: AppShellProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 520;
  const horizontalPadding = compact ? 10 : 16;
  const verticalPadding = compact ? 12 : 24;
  const frameHeight = Math.max(560, Math.min(820, height - insets.top - verticalPadding * 2));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.stage, { paddingHorizontal: horizontalPadding, paddingVertical: verticalPadding }]}>
        <View style={[styles.phoneFrame, { height: frameHeight, borderRadius: compact ? 28 : 24 }]}>
          <View style={styles.content}>{children}</View>
          <BottomNav currentPage={currentPage} bottomInset={0} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ECE5D6',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    minHeight: 560,
    backgroundColor: C.bg,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: C.border,
  },
  content: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
    backgroundColor: C.bg,
  },
  bottomNav: {
    backgroundColor: C.bg,
    borderTopWidth: 0.5,
    borderTopColor: C.borderStrong,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    flexShrink: 0,
  },
  navButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDim: {
    opacity: 0.55,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 16,
    paddingLeft: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  subHeaderBack: {
    width: 30,
    height: 30,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  subHeaderTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: C.text,
  },
});
