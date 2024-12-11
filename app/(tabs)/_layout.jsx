import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import SvgHome from '../../assets/icons/home.svg';
import SvgGarden from '../../assets/icons/garden.svg';
import SvgStats from '../../assets/icons/stats.svg';
import SvgProfil from '../../assets/icons/profil.svg';

const COLORS = {
  backgroundColor: '#2E4834',
  transparent: 'transparent',
  tabBarBackground: '#1E3123',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundColor,
    flex: 1, // Same background color as tabBarStyle
  },
  tabBarIconContainer: {
    backgroundColor: COLORS.transparent,
    borderRadius: 15,
    padding: 10,
  },
  tabBarIconContainerFocused: {
    backgroundColor: COLORS.backgroundColor,
  },
});

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarStyle: {
            borderTopWidth: 0,
            backgroundColor: COLORS.tabBarBackground,
            height: 65, // Ensure consistent height
            paddingTop: 8,
            borderTopRightRadius: 15,
            borderTopLeftRadius: 15,
          },
          tabBarItemStyle: {
            borderRadius: 15,
            padding: 5,
          },
          tabBarIcon: ({ focused, color }) => {
            let IconComponent;
            if (route.name === 'index') {
              IconComponent = SvgHome;
            } else if (route.name === 'garden') {
              IconComponent = SvgGarden;
            } else if (route.name === 'stats') {
              IconComponent = SvgStats;
            } else if (route.name === 'profil') {
              IconComponent = SvgProfil;
            }

            return (
              <View
                style={[
                  styles.tabBarIconContainer,
                  focused && styles.tabBarIconContainerFocused,
                ]}
              >
                <IconComponent
                  width={30}
                  height={30}
                  fill={color}
                />
              </View>
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
    </View>
  );
}