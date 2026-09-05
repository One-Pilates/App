import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

const mockStudents = [
  { id: '1', name: 'Ana Beatriz Souza', phone: '(11) 98765-4321', status: 'Ativo' },
  { id: '2', name: 'Carlos Eduardo', phone: '(11) 91234-5678', status: 'Ativo' },
  { id: '3', name: 'Fernanda Lima', phone: '(11) 99988-7766', status: 'Inativo' },
  { id: '4', name: 'Gustavo Henrique', phone: '(11) 98877-6655', status: 'Ativo' },
  { id: '5', name: 'Juliana Paes', phone: '(11) 97766-5544', status: 'Ativo' },
  { id: '6', name: 'Lucas Martins', phone: '(11) 96655-4433', status: 'Inativo' },
  { id: '7', name: 'Mariana Silva', phone: '(11) 95544-3322', status: 'Ativo' },
];

export default function StudentsScreen() {
  const [isSearchActive, setIsSearchActive] = useState(false);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.studentCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentPhone}>{item.phone}</Text>
      </View>
      <View style={[styles.statusBadge, item.status === 'Ativo' ? styles.statusActive : styles.statusInactive]}>
        <Text style={[styles.statusText, item.status === 'Ativo' ? styles.statusTextActive : styles.statusTextInactive]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Alunos</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.searchIconButton}
              onPress={() => setIsSearchActive(!isSearchActive)}
            >
              <Feather name="search" size={20} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Novo Aluno</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {isSearchActive && (
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#94a3b8" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Buscar por nome..." 
              placeholderTextColor="#94a3b8"
              autoFocus
            />
          </View>
        )}
      </View>

      <FlatList
        data={mockStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  addButton: {
    backgroundColor: '#f77433', // Laranja
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#f77433',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  listContent: {
    padding: 24,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff3eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f77433',
  },
  infoContainer: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  studentPhone: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
  statusInactive: {
    backgroundColor: '#fff1f2',
    borderColor: '#ffe4e6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: '#047857',
  },
  statusTextInactive: {
    color: '#be123c',
  }
});
