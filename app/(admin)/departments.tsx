// app/(admin)/index.tsx
import AdminHeader from '@/components/AdminHeader';
import * as DepartmentOperations from '@/lib/operations/departments';
import { Colors } from '@/utils/styles';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Department } from '../../lib/db/schema';


export default function DepartmentsScreen() {
  const db = useSQLiteContext();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState<Department>({
    id: undefined,
    name: '',
    term: '',
    year: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch departments from the database on mount
  useEffect(() => {
    loadDepartments();
  }, []);

  // Function to load departments from the database
  const loadDepartments = async () => {
    setLoading(true);
    try {
      const allDepartments = await DepartmentOperations.getAllDepartments(db);
      setDepartments(allDepartments);
    } catch (error) {
      console.error('Error loading departments:', error);
      setError('Failed to load departments. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  // Handle search
  const handleSearch = async () => {
    try {
      setLoading(true);
      if (searchQuery.trim()) {
        const results = await DepartmentOperations.searchDepartments(db, searchQuery);
        setDepartments(results);
      } else {
        await loadDepartments();
      }
    } catch (err) {
      setError('Search failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle adding a new department
  const saveDepartment = async () => {
    try {
      // Validate form
      if (!newDepartment.name || !newDepartment.term || !newDepartment.year) {
        Alert.alert('Error', 'Please fill in all fields.');
        return;
      }
      
      setLoading(true);
      if (isEditing && selectedDepartment) {
        // Update existing department
        await DepartmentOperations.updateDepartment(db, {
          ...selectedDepartment,
          ...newDepartment
        });
      } else {
        // Add new department
        await DepartmentOperations.addDepartment(db, newDepartment);
      }
      // Reset Form
      setNewDepartment({ id: undefined, name: '', term: '', year: '' });
      setIsEditing(false);
      setModalVisible(false);
      await loadDepartments();
      setError(null);
      
    } catch (error) {
      console.error('Error saving department:', error);
      setError('Failed to save department. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  // Handle deleting a department
  const deleteDepartment = async (id: number) => {
    try {
      setLoading(true);
      await DepartmentOperations.deleteDepartment(db, id);
      await loadDepartments();
      setError(null);
    } catch (error) {
      console.error('Error deleting department:', error);
      setError('Failed to delete department. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  // Handle selecting a department for editing
  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setNewDepartment({ ...department });
    setIsEditing(true);
    setModalVisible(true);
  };

  // Handle opening the modal for adding a new department
  const openAddModal = () => {
    setNewDepartment({ id: undefined, name: '', term: '', year: '' });
    setIsEditing(false);
    setModalVisible(true);
  };

  // Handle closing the modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedDepartment(null);
    setNewDepartment({ id: undefined, name: '', term: '', year: '' });
    setIsEditing(false);
  }

  // Handle search input change
  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
  };

  // Handle search button press
  const handleSearchButtonPress = () => {
    handleSearch();
  };

  // Handle clear search button press
  const handleClearSearchButtonPress = () => {
    setSearchQuery('');
    loadDepartments(); // Changed to directly call loadDepartments instead of handleSearch
  };

  // Handle modal close on backdrop press
  const handleBackdropPress = () => {
    closeModal();
  };

  // Handle modal content press to prevent closing
  const handleModalContentPress = (e: any) => {
    // Prevent event from bubbling up to backdrop
    e.stopPropagation();
  };

  // Handle modal close on cancel button press
  const handleCancelButtonPress = () => {
    closeModal();
  };

  // Handle modal close on save button press
  const handleSaveButtonPress = () => {
    saveDepartment();
  };

  // Handle modal close on delete button press
  const handleDeleteButtonPress = async () => {
    if (selectedDepartment) {
      Alert.alert(
        "Confirm Delete",
        `Are you sure you want to delete ${selectedDepartment.name}?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          { 
            text: "Delete", 
            onPress: async () => {
              await deleteDepartment(selectedDepartment.id!);
              closeModal();
            },
            style: "destructive"
          }
        ]
      );
    }
  };

  // View Department Details
  // const viewDepartmentDetails = (department: Department) => {
  //   setSelectedDepartment(department);
  // };

  // Render each department item in the list
  const renderDepartmentItem = ({ item }: { item: Department }) => (
    <View style={styles.departmentItem}>
      <View style={styles.departmentInfo}>
        <Text style={styles.departmentName}>{item.name}</Text>
        <Text style={styles.departmentDetails}>
          {item.term} {item.year}
        </Text>
      </View>
      <View style={styles.departmentActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
          <Ionicons name="pencil" size={24} color="blue" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              "Confirm Delete",
              `Are you sure you want to delete ${item.name}?`,
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                { 
                  text: "Delete", 
                  onPress: () => deleteDepartment(item.id!),
                  style: "destructive"
                }
              ]
            );
          }} 
          style={styles.actionButton}
        >
          <Ionicons name="trash" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyListContainer}>
      <Text style={styles.emptyListText}>No departments found.</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );

  // Render main content conditionally
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AdminHeader title="Departments" />
        {renderLoading()}
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AdminHeader title="Departments" />
        {renderError()}
      </SafeAreaView>
    );
  }
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminHeader title='Departments'/>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search departments..."
            value={searchQuery}
            onChangeText={handleSearchInputChange}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleSearchButtonPress} style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearSearchButtonPress} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <FlatList
          style={styles.flatList}
          data={departments}
          renderItem={renderDepartmentItem}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          ListEmptyComponent={renderEmptyList}
        />
        
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
            <Pressable style={styles.modalContent} onPress={handleModalContentPress}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Department' : 'Add Department'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Department Name"
                value={newDepartment.name}
                onChangeText={(text) => setNewDepartment({ ...newDepartment, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Term"
                value={newDepartment.term}
                onChangeText={(text) => setNewDepartment({ ...newDepartment, term: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Year"
                value={newDepartment.year}
                onChangeText={(text) => setNewDepartment({ ...newDepartment, year: text })}
                keyboardType="numeric"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={handleCancelButtonPress} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveButtonPress} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>{isEditing ? 'Update' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
              {isEditing && (
                <TouchableOpacity onPress={handleDeleteButtonPress} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    width: '100%',
    marginBottom: 16,
  },
  searchInput: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#0066cc',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  flatList: {
    flex: 1,
    width: '100%',
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 30,
    position: 'absolute',
    bottom: 20,
    right: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  departmentItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#c026d3', // fucshia
    fontFamily: 'Regular',
  },
  departmentDetails: {
    fontSize: 12,
    fontFamily: 'Regular',
    color: '#666',
    marginTop: 4,
  },
  departmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: {
    fontSize: 16,
    color: Colors.info['dark'],
    textAlign: 'center',
    fontFamily: 'Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'SemiBold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.success['dark'],
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'SemiBold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 5,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});