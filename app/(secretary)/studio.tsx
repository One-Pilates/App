import { useEffect, useState } from 'react'; 

import { 

  View, 

  Text, 

  StyleSheet, 

  ScrollView, 

  TouchableOpacity, 

  ActivityIndicator, 

  Alert, 

  Modal, 

  TextInput, 

  KeyboardAvoidingView, 

  Platform, 

} from 'react-native'; 

import { Feather } from '@expo/vector-icons'; 

import { useRouter } from 'expo-router'; 

import api from '@/services/api'; 

import { notify } from '@/utils/notify'; 

import { getColorForEspecialidade } from '@/utils/utils'; 

 

interface Especialidade { 

  id: number; 

  nome: string; 

} 

 

interface Sala { 

  id: number; 

  nome: string; 

  quantidadeMaximaAlunos: number; 

  quantidadeEquipamentosPCD: number; 

  especialidades?: (string | { nome: string })[]; 

} 

 

interface SalaForm { 

  nome: string; 

  quantidadeMaximaAlunos: string; 

  quantidadeEquipamentosPCD: string; 

  especialidadesIds: number[]; 

} 

 

type Tab = 'especialidades' | 'salas'; 

 

const emptySala: SalaForm = { 

  nome: '', 

  quantidadeMaximaAlunos: '', 

  quantidadeEquipamentosPCD: '', 

  especialidadesIds: [], 

}; 

 

function nomeEsp(esp: string | { nome: string }): string { 

  return typeof esp === 'string' ? esp : esp.nome; 

} 

 

export default function StudioScreen() { 

  const router = useRouter(); 

  const [activeTab, setActiveTab] = useState<Tab>('especialidades'); 

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]); 

  const [salas, setSalas] = useState<Sala[]>([]); 

  const [loading, setLoading] = useState(true); 

 

  // Modal especialidade 

  const [showEspModal, setShowEspModal] = useState(false); 

  const [editingEsp, setEditingEsp] = useState<Especialidade | null>(null); 

  const [formEsp, setFormEsp] = useState(''); 

  const [savingEsp, setSavingEsp] = useState(false); 

 

  // Modal sala 

  const [showSalaModal, setShowSalaModal] = useState(false); 

  const [editingSala, setEditingSala] = useState<Sala | null>(null); 

  const [formSala, setFormSala] = useState<SalaForm>(emptySala); 

  const [savingSala, setSavingSala] = useState(false); 

 

  async function fetchData() { 

    setLoading(true); 

    try { 

      const espResponse = await api.get('api/especialidades'); 

      setEspecialidades(espResponse.data || []); 

      if (activeTab === 'salas') { 

        const salasResponse = await api.get('api/salas'); 

        setSalas(salasResponse.data || []); 

      } 

    } catch (error) { 

      console.error('Erro ao buscar dados do studio:', error); 

      notify.error('Ocorreu um erro ao carregar os dados.'); 

    } finally { 

      setLoading(false); 

    } 

  } 

 

  useEffect(() => { 

    fetchData(); 

    // eslint-disable-next-line react-hooks/exhaustive-deps 

  }, [activeTab]); 

 

  // ----- Especialidades ----- 

  function openAddEsp() { 

    setEditingEsp(null); 

    setFormEsp(''); 

    setShowEspModal(true); 

  } 

 

  function openEditEsp(esp: Especialidade) { 

    setEditingEsp(esp); 

    setFormEsp(esp.nome); 

    setShowEspModal(true); 

  } 

 

  async function saveEsp() { 

    if (!formEsp.trim()) { 

      notify.warning('O nome da especialidade não pode estar vazio.'); 

      return; 

    } 

    setSavingEsp(true); 

    try { 

      if (editingEsp) { 

        await api.patch(`api/especialidades/${editingEsp.id}`, { nome: formEsp }); 

        setEspecialidades((prev) => 

          prev.map((e) => (e.id === editingEsp.id ? { ...e, nome: formEsp } : e)), 

        ); 

        notify.success('Especialidade atualizada com sucesso!'); 

      } else { 

        const response = await api.post('api/especialidades', { nome: formEsp }); 

        setEspecialidades((prev) => [...prev, response.data]); 

        notify.success('Especialidade criada com sucesso!'); 

      } 

      setShowEspModal(false); 

    } catch (error) { 

      console.error('Erro ao salvar especialidade:', error); 

      notify.error('Ocorreu um erro ao salvar a especialidade.'); 

    } finally { 

      setSavingEsp(false); 

    } 

  } 

 

  function deleteEsp(esp: Especialidade) { 

    Alert.alert('Excluir especialidade', `Deseja excluir "${esp.nome}"? Essa ação não pode ser desfeita.`, [ 

      { text: 'Cancelar', style: 'cancel' }, 

      { 

        text: 'Excluir', 

        style: 'destructive', 

        onPress: async () => { 

          try { 

            await api.delete(`api/especialidades/${esp.id}`); 

            setEspecialidades((prev) => prev.filter((e) => e.id !== esp.id)); 

            notify.success('Especialidade deletada com sucesso.'); 

          } catch (error) { 

            console.error('Erro ao deletar especialidade:', error); 

            notify.error('Ocorreu um erro ao deletar a especialidade.'); 

          } 

        }, 

      }, 

    ]); 

  } 

 

  // ----- Salas ----- 

  function openAddSala() { 

    setEditingSala(null); 

    setFormSala(emptySala); 

    setShowSalaModal(true); 

  } 

 

  function openEditSala(sala: Sala) { 

    const ids = (sala.especialidades || []) 

      .map((e) => especialidades.find((esp) => esp.nome === nomeEsp(e))?.id) 

      .filter((id): id is number => id != null); 

    setEditingSala(sala); 

    setFormSala({ 

      nome: sala.nome, 

      quantidadeMaximaAlunos: String(sala.quantidadeMaximaAlunos ?? ''), 

      quantidadeEquipamentosPCD: String(sala.quantidadeEquipamentosPCD ?? ''), 

      especialidadesIds: ids, 

    }); 

    setShowSalaModal(true); 

  } 

 

  function toggleSalaEsp(id: number) { 

    setFormSala((prev) => ({ 

      ...prev, 

      especialidadesIds: prev.especialidadesIds.includes(id) 

        ? prev.especialidadesIds.filter((x) => x !== id) 

        : [...prev.especialidadesIds, id], 

    })); 

  } 

 

  async function saveSala() { 

    if (!formSala.nome.trim()) { 

      notify.warning('O nome da sala não pode estar vazio.'); 

      return; 

    } 

    if (!formSala.quantidadeMaximaAlunos || Number.isNaN(Number(formSala.quantidadeMaximaAlunos))) { 

      notify.warning('A quantidade máxima de alunos deve ser um número válido.'); 

      return; 

    } 

    if ( 

      formSala.quantidadeEquipamentosPCD === '' || 

      Number.isNaN(Number(formSala.quantidadeEquipamentosPCD)) 

    ) { 

      notify.warning('A quantidade de equipamentos para PCD deve ser um número válido.'); 

      return; 

    } 

    if (formSala.especialidadesIds.length === 0) { 

      notify.warning('Selecione pelo menos uma especialidade.'); 

      return; 

    } 

 

    const salaObj = { 

      nome: formSala.nome, 

      especialidadeIds: formSala.especialidadesIds, 

      quantidadeMaximaAlunos: Number(formSala.quantidadeMaximaAlunos), 

      quantidadeEquipamentosPCD: Number(formSala.quantidadeEquipamentosPCD), 

    }; 

 

    setSavingSala(true); 

    try { 

      if (editingSala) { 

        const response = await api.patch(`api/salas/${editingSala.id}`, salaObj); 

        setSalas((prev) => prev.map((s) => (s.id === editingSala.id ? { ...s, ...response.data } : s))); 

        notify.success('Sala atualizada com sucesso!'); 

      } else { 

        const response = await api.post('api/salas', salaObj); 

        setSalas((prev) => [...prev, response.data]); 

        notify.success('Sala criada com sucesso!'); 

      } 

      setShowSalaModal(false); 

    } catch (error) { 

      console.error('Erro ao salvar sala:', error); 

      notify.error('Ocorreu um erro ao salvar a sala.'); 

    } finally { 

      setSavingSala(false); 

    } 

  } 

 

  function deleteSala(sala: Sala) { 

    Alert.alert('Excluir sala', `Deseja excluir "${sala.nome}"? Essa ação não pode ser desfeita.`, [ 

      { text: 'Cancelar', style: 'cancel' }, 

      { 

        text: 'Excluir', 

        style: 'destructive', 

        onPress: async () => { 

          try { 

            await api.delete(`api/salas/${sala.id}`); 

            setSalas((prev) => prev.filter((s) => s.id !== sala.id)); 

            notify.success('Sala deletada com sucesso.'); 

          } catch (error) { 

            console.error('Erro ao deletar sala:', error); 

            notify.error('Ocorreu um erro ao deletar a sala.'); 

          } 

        }, 

      }, 

    ]); 

  } 

 

  return ( 

    <View style={styles.container}> 

      {/* Header */} 

      <View style={styles.header}> 

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}> 

          <Feather name="arrow-left" size={22} color="#0f172a" /> 

        </TouchableOpacity> 

        <Text style={styles.pageTitle}>Configurações do Studio</Text> 

      </View> 

 

      {/* Tabs */} 

      <View style={styles.tabsRow}> 

        {(['especialidades', 'salas'] as Tab[]).map((t) => ( 

          <TouchableOpacity 

            key={t} 

            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]} 

            onPress={() => setActiveTab(t)} 

          > 

            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}> 

              {t === 'especialidades' ? 'Especialidades' : 'Salas'} 

            </Text> 

          </TouchableOpacity> 

        ))} 

      </View> 

 

      {loading ? ( 

        <View style={styles.center}> 

          <ActivityIndicator size="large" color="#f77433" /> 

        </View> 

      ) : ( 

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}> 

          <View style={styles.sectionHeader}> 

            <Text style={styles.sectionTitle}> 

              {activeTab === 'especialidades' ? 'Especialidades' : 'Salas'} Cadastradas 

            </Text> 

            <TouchableOpacity 

              style={styles.addButton} 

              onPress={activeTab === 'especialidades' ? openAddEsp : openAddSala} 

            > 

              <Feather name="plus" size={16} color="#fff" /> 

              <Text style={styles.addButtonText}> 

                {activeTab === 'especialidades' ? 'Nova' : 'Nova Sala'} 

              </Text> 

            </TouchableOpacity> 

          </View> 

 

          {activeTab === 'especialidades' ? ( 

            especialidades.length > 0 ? ( 

              especialidades.map((esp) => { 

                const { backgroundColor } = getColorForEspecialidade(esp.nome); 

                return ( 

                  <View key={esp.id} style={styles.espCard}> 

                    <View style={[styles.colorBar, { backgroundColor }]} /> 

                    <Text style={styles.espName}>{esp.nome}</Text> 

                    <View style={styles.cardActions}> 

                      <TouchableOpacity style={styles.actionBtn} onPress={() => openEditEsp(esp)}> 

                        <Feather name="edit-2" size={18} color="#2563eb" /> 

                      </TouchableOpacity> 

                      <TouchableOpacity style={styles.actionBtn} onPress={() => deleteEsp(esp)}> 

                        <Feather name="trash-2" size={18} color="#e11d48" /> 

                      </TouchableOpacity> 

                    </View> 

                  </View> 

                ); 

              }) 

            ) : ( 

              <Text style={styles.empty}>Nenhuma especialidade cadastrada ainda.</Text> 

            ) 

          ) : salas.length > 0 ? ( 

            salas.map((sala) => ( 

              <View key={sala.id} style={styles.salaCard}> 

                <View style={styles.salaHeader}> 

                  <Text style={styles.salaName}>{sala.nome}</Text> 

                  <View style={styles.cardActions}> 

                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditSala(sala)}> 

                      <Feather name="edit-2" size={18} color="#2563eb" /> 

                    </TouchableOpacity> 

                    <TouchableOpacity style={styles.actionBtn} onPress={() => deleteSala(sala)}> 

                      <Feather name="trash-2" size={18} color="#e11d48" /> 

                    </TouchableOpacity> 

                  </View> 

                </View> 

 

                <View style={styles.salaMeta}> 

                  <View style={[styles.metaBadge, styles.metaBlue]}> 

                    <Text style={styles.metaBlueText}>{sala.quantidadeMaximaAlunos} alunos</Text> 

                  </View> 

                  <View style={[styles.metaBadge, styles.metaViolet]}> 

                    <Text style={styles.metaVioletText}> 

                      {sala.quantidadeEquipamentosPCD} PCD 

                    </Text> 

                  </View> 

                </View> 

 

                <Text style={styles.salaEspLabel}>Especialidades</Text> 

                <View style={styles.chipsWrap}> 

                  {sala.especialidades && sala.especialidades.length > 0 ? ( 

                    sala.especialidades.map((e, i) => { 

                      const nome = nomeEsp(e); 

                      const { backgroundColor } = getColorForEspecialidade(nome); 

                      return ( 

                        <View key={`${nome}-${i}`} style={[styles.espChip, { backgroundColor }]}> 

                          <Text style={styles.espChipText}>{nome}</Text> 

                        </View> 

                      ); 

                    }) 

                  ) : ( 

                    <Text style={styles.noEsp}>Nenhuma especialidade vinculada</Text> 

                  )} 

                </View> 

              </View> 

            )) 

          ) : ( 

            <Text style={styles.empty}>Nenhuma sala cadastrada ainda.</Text> 

          )} 

        </ScrollView> 

      )} 

 

      {/* Modal Especialidade */} 

      <Modal visible={showEspModal} transparent animationType="fade" onRequestClose={() => setShowEspModal(false)}> 

        <KeyboardAvoidingView 

          style={styles.modalOverlay} 

          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 

        > 

          <View style={styles.modalCard}> 

            <View style={styles.modalHeader}> 

              <Text style={styles.modalTitle}> 

                {editingEsp ? 'Editar Especialidade' : 'Nova Especialidade'} 

              </Text> 

              <TouchableOpacity onPress={() => setShowEspModal(false)}> 

                <Feather name="x" size={24} color="#94a3b8" /> 

              </TouchableOpacity> 

            </View> 

 

            <Text style={styles.label}>Nome da Especialidade</Text> 

            <TextInput 

              style={styles.input} 

              value={formEsp} 

              onChangeText={setFormEsp} 

              placeholder="Ex: Fisioterapia" 

              placeholderTextColor="#94a3b8" 

            /> 

 

            <View style={styles.modalActions}> 

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEspModal(false)}> 

                <Text style={styles.cancelBtnText}>Cancelar</Text> 

              </TouchableOpacity> 

              <TouchableOpacity style={styles.saveBtn} onPress={saveEsp} disabled={savingEsp}> 

                {savingEsp ? ( 

                  <ActivityIndicator color="#fff" /> 

                ) : ( 

                  <Text style={styles.saveBtnText}>Salvar</Text> 

                )} 

              </TouchableOpacity> 

            </View> 

          </View> 

        </KeyboardAvoidingView> 

      </Modal> 

 

      {/* Modal Sala */} 

      <Modal visible={showSalaModal} transparent animationType="fade" onRequestClose={() => setShowSalaModal(false)}> 

        <KeyboardAvoidingView 

          style={styles.modalOverlay} 

          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 

        > 

          <View style={[styles.modalCard, styles.modalCardLarge]}> 

            <View style={styles.modalHeader}> 

              <Text style={styles.modalTitle}>{editingSala ? 'Editar Sala' : 'Nova Sala'}</Text> 

              <TouchableOpacity onPress={() => setShowSalaModal(false)}> 

                <Feather name="x" size={24} color="#94a3b8" /> 

              </TouchableOpacity> 

            </View> 

 

            <ScrollView showsVerticalScrollIndicator={false}> 

              <Text style={styles.label}>Nome da Sala</Text> 

              <TextInput 

                style={styles.input} 

                value={formSala.nome} 

                onChangeText={(v) => setFormSala((p) => ({ ...p, nome: v }))} 

                placeholder="Ex: Sala Reformer" 

                placeholderTextColor="#94a3b8" 

              /> 

 

              <View style={styles.rowGroup}> 

                <View style={styles.flex1}> 

                  <Text style={styles.label}>Capacidade</Text> 

                  <TextInput 

                    style={styles.input} 

                    value={formSala.quantidadeMaximaAlunos} 

                    onChangeText={(v) => 

                      setFormSala((p) => ({ ...p, quantidadeMaximaAlunos: v.replace(/\D/g, '') })) 

                    } 

                    placeholder="0" 

                    placeholderTextColor="#94a3b8" 

                    keyboardType="number-pad" 

                  /> 

                </View> 

                <View style={styles.flex1}> 

                  <Text style={styles.label}>Equip. PCD</Text> 

                  <TextInput 

                    style={styles.input} 

                    value={formSala.quantidadeEquipamentosPCD} 

                    onChangeText={(v) => 

                      setFormSala((p) => ({ ...p, quantidadeEquipamentosPCD: v.replace(/\D/g, '') })) 

                    } 

                    placeholder="0" 

                    placeholderTextColor="#94a3b8" 

                    keyboardType="number-pad" 

                  /> 

                </View> 

              </View> 

 

              <Text style={styles.label}>Especialidades Permitidas</Text> 

              <View style={styles.chipsWrap}> 

                {especialidades.map((esp) => { 

                  const selected = formSala.especialidadesIds.includes(esp.id); 

                  return ( 

                    <TouchableOpacity 

                      key={esp.id} 

                      style={[styles.selectChip, selected && styles.selectChipActive]} 

                      onPress={() => toggleSalaEsp(esp.id)} 

                    > 

                      <Text style={[styles.selectChipText, selected && styles.selectChipTextActive]}> 

                        {esp.nome} 

                      </Text> 

                      {selected && <Feather name="check" size={14} color="#fff" />} 

                    </TouchableOpacity> 

                  ); 

                })} 

              </View> 

            </ScrollView> 

 

            <View style={styles.modalActions}> 

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSalaModal(false)}> 

                <Text style={styles.cancelBtnText}>Cancelar</Text> 

              </TouchableOpacity> 

              <TouchableOpacity style={styles.saveBtn} onPress={saveSala} disabled={savingSala}> 

                {savingSala ? ( 

                  <ActivityIndicator color="#fff" /> 

                ) : ( 

                  <Text style={styles.saveBtnText}>Salvar</Text> 

                )} 

              </TouchableOpacity> 

            </View> 

          </View> 

        </KeyboardAvoidingView> 

      </Modal> 

    </View> 

  ); 

} 

 

const styles = StyleSheet.create({ 

  container: { flex: 1, backgroundColor: '#f8fafc' }, 

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, 

  header: { 

    flexDirection: 'row', 

    alignItems: 'center', 

    paddingHorizontal: 20, 

    paddingTop: 16, 

    paddingBottom: 12, 

  }, 

  backButton: { 

    width: 40, 

    height: 40, 

    borderRadius: 12, 

    backgroundColor: '#fff', 

    justifyContent: 'center', 

    alignItems: 'center', 

    marginRight: 12, 

    borderWidth: 1, 

    borderColor: '#f1f5f9', 

  }, 

  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', flex: 1 }, 

  tabsRow: { 

    flexDirection: 'row', 

    gap: 8, 

    paddingHorizontal: 20, 

    marginBottom: 8, 

  }, 

  tabBtn: { 

    paddingVertical: 10, 

    paddingHorizontal: 18, 

    borderRadius: 999, 

    backgroundColor: '#f1f5f9', 

    borderWidth: 1, 

    borderColor: '#e2e8f0', 

  }, 

  tabBtnActive: { backgroundColor: '#f77433', borderColor: '#f77433' }, 

  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' }, 

  tabTextActive: { color: '#fff' }, 

  content: { padding: 20, paddingBottom: 60 }, 

  sectionHeader: { 

    flexDirection: 'row', 

    alignItems: 'center', 

    justifyContent: 'space-between', 

    marginBottom: 16, 

  }, 

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', flex: 1 }, 

  addButton: { 

    flexDirection: 'row', 

    alignItems: 'center', 

    gap: 6, 

    backgroundColor: '#f77433', 

    paddingHorizontal: 14, 

    paddingVertical: 9, 

    borderRadius: 10, 

  }, 

  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }, 

  empty: { textAlign: 'center', color: '#94a3b8', fontWeight: '500', marginTop: 40 }, 

  espCard: { 

    flexDirection: 'row', 

    alignItems: 'center', 

    backgroundColor: '#fff', 

    borderRadius: 14, 

    padding: 16, 

    marginBottom: 12, 

    borderWidth: 1, 

    borderColor: '#f1f5f9', 

    shadowColor: '#000', 

    shadowOffset: { width: 0, height: 1 }, 

    shadowOpacity: 0.04, 

    shadowRadius: 6, 

    elevation: 1, 

  }, 

  colorBar: { width: 6, height: 36, borderRadius: 3, marginRight: 14 }, 

  espName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#334155' }, 

  cardActions: { flexDirection: 'row', gap: 6 }, 

  actionBtn: { 

    width: 34, 

    height: 34, 

    borderRadius: 8, 

    backgroundColor: '#f8fafc', 

    justifyContent: 'center', 

    alignItems: 'center', 

    borderWidth: 1, 

    borderColor: '#f1f5f9', 

  }, 

  salaCard: { 

    backgroundColor: '#fff', 

    borderRadius: 16, 

    padding: 18, 

    marginBottom: 14, 

    borderWidth: 1, 

    borderColor: '#f1f5f9', 

    shadowColor: '#000', 

    shadowOffset: { width: 0, height: 2 }, 

    shadowOpacity: 0.04, 

    shadowRadius: 8, 

    elevation: 2, 

  }, 

  salaHeader: { 

    flexDirection: 'row', 

    alignItems: 'center', 

    justifyContent: 'space-between', 

    marginBottom: 12, 

  }, 

  salaName: { fontSize: 18, fontWeight: '800', color: '#0f172a', flex: 1 }, 

  salaMeta: { flexDirection: 'row', gap: 10, marginBottom: 14 }, 

  metaBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 }, 

  metaBlue: { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }, 

  metaBlueText: { color: '#1d4ed8', fontWeight: 'bold', fontSize: 13 }, 

  metaViolet: { backgroundColor: '#f5f3ff', borderColor: '#ede9fe' }, 

  metaVioletText: { color: '#6d28d9', fontWeight: 'bold', fontSize: 13 }, 

  salaEspLabel: { 

    fontSize: 12, 

    fontWeight: '700', 

    color: '#94a3b8', 

    textTransform: 'uppercase', 

    letterSpacing: 0.5, 

    marginBottom: 8, 

  }, 

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, 

  espChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }, 

  espChipText: { color: '#fff', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }, 

  noEsp: { color: '#cbd5e1', fontStyle: 'italic', fontSize: 13 }, 

  modalOverlay: { 

    flex: 1, 

    backgroundColor: 'rgba(15,23,42,0.4)', 

    justifyContent: 'center', 

    padding: 20, 

  }, 

  modalCard: { 

    backgroundColor: '#fff', 

    borderRadius: 20, 

    padding: 24, 

  }, 

  modalCardLarge: { maxHeight: '85%' }, 

  modalHeader: { 

    flexDirection: 'row', 

    alignItems: 'center', 

    justifyContent: 'space-between', 

    marginBottom: 20, 

  }, 

  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' }, 

  label: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 8, marginTop: 8 }, 

  input: { 

    backgroundColor: '#f8fafc', 

    borderRadius: 12, 

    borderWidth: 2, 

    borderColor: '#f1f5f9', 

    paddingHorizontal: 14, 

    paddingVertical: 12, 

    fontSize: 15, 

    color: '#0f172a', 

  }, 

  rowGroup: { flexDirection: 'row', gap: 12 }, 

  flex1: { flex: 1 }, 

  selectChip: { 

    flexDirection: 'row', 

    alignItems: 'center', 

    gap: 6, 

    paddingHorizontal: 14, 

    paddingVertical: 8, 

    borderRadius: 20, 

    backgroundColor: '#f1f5f9', 

    borderWidth: 1, 

    borderColor: '#e2e8f0', 

  }, 

  selectChipActive: { backgroundColor: '#f77433', borderColor: '#f77433' }, 

  selectChipText: { fontSize: 14, color: '#475569', fontWeight: '500' }, 

  selectChipTextActive: { color: '#fff' }, 

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 }, 

  cancelBtn: { 

    flex: 1, 

    paddingVertical: 14, 

    borderRadius: 12, 

    backgroundColor: '#e2e8f0', 

    alignItems: 'center', 

  }, 

  cancelBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 15 }, 

  saveBtn: { 

    flex: 1, 

    paddingVertical: 14, 

    borderRadius: 12, 

    backgroundColor: '#f77433', 

    alignItems: 'center', 

  }, 

  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }, 

}); 