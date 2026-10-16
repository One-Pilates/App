  import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'; 
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import { Feather } from '@expo/vector-icons'; 

  import { useRouter } from 'expo-router'; 

  import { useAuth } from '@/contexts/AuthContext'; 

 

  interface MenuItem { 

    key: string; 

    label: string; 

    description: string; 

    icon: keyof typeof Feather.glyphMap; 

    onPress: () => void; 

  } 

 

  export default function MaisScreen() { 
    const router = useRouter(); 
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth(); 

    const isAdmin = (user?.role || '').toUpperCase() === 'ADMINISTRADOR'; 

 

    const items: MenuItem[] = [ 

      { 

        key: 'colaboradores', 

        label: 'Colaboradores', 

        description: 'Professores e secretárias', 

        icon: 'briefcase', 

        onPress: () => router.push('/(secretary)/colaboradores'), 

      }, 

      ...(isAdmin 

        ? [ 

            { 

              key: 'studio', 

              label: 'Studio', 

              description: 'Especialidades e salas', 

              icon: 'sliders' as keyof typeof Feather.glyphMap, 

              onPress: () => router.push('/(secretary)/studio'), 

            }, 

          ] 

        : []), 

      { 

        key: 'perfil', 

        label: 'Perfil', 

        description: 'Seus dados e preferências', 

        icon: 'user', 

        onPress: () => router.push('/(secretary)/perfil'), 

      }, 

    ]; 

 

    return ( 
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.content, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]} 
        showsVerticalScrollIndicator={false} 
      > 

        <View style={styles.header}> 

          <Text style={styles.pageTitle}>Mais</Text> 

          <Text style={styles.pageSubtitle}>Gestão e configurações</Text> 

        </View> 

 

        <View style={styles.card}> 

          {items.map((item, index) => ( 

            <TouchableOpacity 

              key={item.key} 

              style={[styles.row, index < items.length - 1 && styles.rowBorderBottom]} 

              onPress={item.onPress} 

              activeOpacity={0.7} 

            > 

              <View style={styles.iconWrap}> 

                <Feather name={item.icon} size={20} color="#f77433" /> 

              </View> 

              <View style={styles.rowTexts}> 

                <Text style={styles.rowLabel}>{item.label}</Text> 

                <Text style={styles.rowDescription}>{item.description}</Text> 

              </View> 

              <Feather name="chevron-right" size={20} color="#cbd5e1" /> 

            </TouchableOpacity> 

          ))} 

        </View> 

 

        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}> 

          <Feather name="log-out" size={18} color="#ef4444" /> 

          <Text style={styles.logoutText}>Sair da Conta</Text> 

        </TouchableOpacity> 

      </ScrollView> 

    ); 

  } 

 

  const styles = StyleSheet.create({ 

    container: { flex: 1, backgroundColor: '#f8fafc' }, 
    content: { paddingHorizontal: 16, paddingBottom: 40 }, 
    header: { marginBottom: 16 }, 
    pageTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' }, 
    pageSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 }, 

    card: { 

      backgroundColor: '#fff', 

      borderRadius: 16, 

      marginBottom: 16, 

      shadowColor: '#000', 

      shadowOffset: { width: 0, height: 2 }, 

      shadowOpacity: 0.04, 

      shadowRadius: 8, 

      elevation: 2, 

      borderWidth: 1, 

      borderColor: '#f1f5f9', 

      overflow: 'hidden', 

    }, 

    row: { 

      flexDirection: 'row', 

      alignItems: 'center', 

      padding: 16, 

    }, 

    rowBorderBottom: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }, 

    iconWrap: { 

      width: 44, 

      height: 44, 

      borderRadius: 12, 

      backgroundColor: '#fff3eb', 

      justifyContent: 'center', 

      alignItems: 'center', 

      marginRight: 14, 

    }, 

    rowTexts: { flex: 1 }, 

    rowLabel: { fontSize: 16, fontWeight: '600', color: '#0f172a' }, 

    rowDescription: { fontSize: 13, color: '#64748b', marginTop: 2 }, 

    logoutButton: { 

      flexDirection: 'row', 

      alignItems: 'center', 

      justifyContent: 'center', 

      gap: 8, 

      borderRadius: 12, 

      paddingVertical: 15, 

      borderWidth: 1, 

      borderColor: '#fecaca', 

      backgroundColor: '#fef2f2', 

    }, 

    logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' }, 

  }); 

 

 