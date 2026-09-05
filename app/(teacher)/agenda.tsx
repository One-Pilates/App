import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configurar locale para PT-BR
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

const mockClasses = [
  { id: '1', time: '08:00', type: 'Pilates', instructor: 'Flavia', students: 5 },
  { id: '2', time: '09:00', type: 'Fisioterapia', instructor: 'Claudia', students: 3 },
  { id: '3', time: '10:00', type: 'Pilates', instructor: 'Mariana', students: 4 },
  { id: '4', time: '14:00', type: 'Pilates', instructor: 'Flavia', students: 6 },
  { id: '5', time: '15:00', type: 'RPG', instructor: 'Flavia', students: 2 },
  { id: '6', time: '16:00', type: 'Fisioterapia', instructor: 'Mariana', students: 8 },
];

const daysOfWeek = [
  { id: '1', day: 'Seg', date: '12' },
  { id: '2', day: 'Ter', date: '13', active: true },
  { id: '3', day: 'Qua', date: '14' },
  { id: '4', day: 'Qui', date: '15' },
  { id: '5', day: 'Sex', date: '16' },
  { id: '6', day: 'Sáb', date: '17' },
];

export default function CalendarScreen() {
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  const getPillStyle = (type: string) => {
    switch (type) {
      case 'Pilates':
        return { bg: '#f77433', text: '#fff' }; // Laranja
      case 'Fisioterapia':
        return { bg: '#3b82f6', text: '#fff' }; // Azul
      case 'RPG':
        return { bg: '#22c55e', text: '#fff' }; // Verde
      default:
        return { bg: '#e2e8f0', text: '#475569' }; // Default Cinza
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const pill = getPillStyle(item.type);

    return (
      <TouchableOpacity style={styles.classCard} activeOpacity={0.8}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <View style={styles.infoContainer}>
          <View style={[styles.typePill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.typeText, { color: pill.text }]}>{item.type}</Text>
          </View>
          <Text style={styles.instructor}>Prof: {item.instructor}</Text>
        </View>
        <View style={styles.studentsContainer}>
          <Feather name="users" size={16} color="#6b7280" />
          <Text style={styles.studentsText}>{item.students}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Agenda</Text>
          <TouchableOpacity 
            style={styles.monthButton} 
            onPress={() => setShowFullCalendar(!showFullCalendar)}
          >
            <Text style={styles.monthButtonText}>Agosto</Text>
            <Feather name={showFullCalendar ? "chevron-up" : "chevron-down"} size={16} color="#f77433" />
          </TouchableOpacity>
        </View>
        
        {showFullCalendar ? (
          <Calendar
            theme={{
              todayTextColor: '#f77433',
              arrowColor: '#f77433',
              selectedDayBackgroundColor: '#f77433',
              dotColor: '#f77433',
            }}
            onDayPress={(day: any) => {
              setShowFullCalendar(false); // Fecha o calendário após selecionar
            }}
            style={styles.fullCalendar}
          />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysContainer}>
            {daysOfWeek.map((d) => (
              <View key={d.id} style={[styles.dayCard, d.active && styles.dayCardActive]}>
                <Text style={[styles.dayText, d.active && styles.dayTextActive]}>{d.day}</Text>
                <Text style={[styles.dateText, d.active && styles.dateTextActive]}>{d.date}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={mockClasses}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  monthButtonText: {
    color: '#f77433',
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 14,
  },
  fullCalendar: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dayCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 12,
  },
  dayCardActive: {
    backgroundColor: '#f77433',
  },
  dayText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  dayTextActive: {
    color: '#fff',
    opacity: 0.9,
  },
  dateText: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  dateTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 24,
  },
  classCard: {
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
  timeContainer: {
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 16,
  },
  timeText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructor: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  studentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  studentsText: {
    marginLeft: 6,
    fontWeight: '600',
    color: '#475569',
  }
});
