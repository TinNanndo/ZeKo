import { Tabs } from 'expo-router';
import SvgHome from '../../assets/images/icons/home.svg';
import SvgGarden from '../../assets/images/icons/garden.svg';
import SvgStats from '../../assets/images/icons/stats.svg'
import SvgProfil from '../../assets/images/icons/profil.svg';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: '#1E3123',
          height: 70, // Increase the height of the tab bar
          paddingTop: 15, // Add padding to bring icons down
          borderTopRightRadius: 15,
          borderTopLeftRadius: 15,
          overflow: 'hidden', // Ensure background color is applied correctly
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          if (route.name === 'index') {
            IconComponent = SvgHome;
          } else if (route.name === 'garden'){
            IconComponent = SvgGarden;
          } else if (route.name === 'stats'){
            IconComponent = SvgStats;
          } else if (route.name === 'profil') {
            IconComponent = SvgProfil;
          }

          return (
            <IconComponent
              width={40}
              height={40}
              fill={color}
              style={{
                borderColor: focused ? '#FFFFFF' : 'transparent',
                borderWidth: focused ? 2 : 0,
                borderRadius: 20,
                padding: 5,
              }}
            />
          );
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarLabel: '',
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          headerShown: false,
          tabBarLabel: '',
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          headerShown: false,
          tabBarLabel: '',
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          headerShown: false,
          tabBarLabel: '',
        }}
      />
    </Tabs>
  );
}