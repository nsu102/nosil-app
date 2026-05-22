import { Tabs } from 'expo-router';
import { useFonts } from 'expo-font';
import { DataProvider } from '../contexts/DataContext';
import { F } from '../data/fonts';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [F.serifLight]: require('../assets/fonts/CormorantGaramond-Light.ttf'),
    [F.serifRegular]: require('../assets/fonts/CormorantGaramond-Regular.ttf'),
    [F.serifMedium]: require('../assets/fonts/CormorantGaramond-Medium.ttf'),
    [F.sansMedium]: require('../assets/fonts/Montserrat-Medium.ttf'),
    [F.sansBold]: require('../assets/fonts/Montserrat-Bold.ttf'),
    [F.sansExtraBold]: require('../assets/fonts/Montserrat-ExtraBold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <DataProvider>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI 상담',
        }}
      />
      <Tabs.Screen
        name="recommend"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="encyclopedia"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="daily"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="record"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="hospitals"
        options={{ href: null }}
      />
    </Tabs>
    </DataProvider>
  );
}
