// lib/operations/departments.ts

import { SQLiteDatabase } from "expo-sqlite";
import { Department, Student } from "../db/schema";

/**
 * Create a new department
 * @param db Database instance
 * @param department Department data
 * @returns Newly created department with ID
 */
export async function addDepartment(db: SQLiteDatabase, department: Department): Promise<Department> {
    const { name, term, year, description, startDate, endDate } = department;
    try {
        const result = await db.runAsync(
            "INSERT INTO departments (name, term, year, description, startDate, endDate) VALUES (?, ?, ?, ?, ?, ?)",
            name,
            term,
            year,
            description ?? null,
            startDate ?? null,
            endDate ?? null




        );
    
        return {
        id: result.lastInsertRowId,
        ...department,
        };
    } catch (error) {
        console.error("Error adding department:", error);
        throw error;
    }
    
}

/**
 * Get all departments
 * @param db Database instance
 * @returns Array of departments
 */
export async function getAllDepartments(db: SQLiteDatabase): Promise<Department[]> {
    try {
        const departments = await db.getAllAsync<Department>(
        "SELECT * FROM departments ORDER BY name"
        );
        return departments;
    } catch (error) {
        console.error("Error getting departments:", error);
        throw error;
    }
}

/**
 * Get a department by ID
 * @param db Database instance
 * @param id Department ID
 * @returns Department data or null if not found
 */
export async function getDepartmentById(db: SQLiteDatabase, id: number): Promise<Department | null> {
    try {
        const department = await db.getFirstAsync<Department>(
        "SELECT * FROM departments WHERE id = ?",
        id
        );
        return department || null;
    } catch (error) {
        console.error(`Error getting department with ID ${id}:`, error);
        throw error;
    }
}


/**
 * Update a department
 * @param db Database instance
 * @param department Department data with ID
 * @returns Whether the update was successful
 */
export async function updateDepartment(db: SQLiteDatabase, department: Department): Promise<boolean> {
    const { id, name, term, year, description, startDate, endDate, isActive} = department
    try {
        if (!id) {
            throw new Error("Department ID is required for update.");
        }
        const result = await db.runAsync(
            "UPDATE departments SET name = ?, term = ?, year = ?, description = ?, startDate = ?, endDate = ?, isActive = ? WHERE id = ?",
            name,
            term,
            year,
            description ?? null,
            startDate ?? null,
            endDate ?? null,
            isActive ?? null,
            id




        );
        // Check if any rows were changed
        // If changes > 0, the update was successful
        // If changes = 0, the department was not found or no changes were made
        return result.changes > 0;
    } catch (error) {
        console.error('Error updating department:', error);
        throw error;
    }
}


/**
 * Delete a department
 * @param db Database instance
 * @param id Department ID
 * @returns Whether the deletion was successful
 */
export async function deleteDepartment(db: SQLiteDatabase, id: number): Promise<boolean> {
    // Hard delete
    try {
        const result = await db.runAsync("DELETE FROM departments WHERE id = ?", id);
        return result.changes > 0;
    } catch (error) {
        console.error(`Error deleting department with ID ${id}:`, error);
        throw error;
    }
}


/**
 * Search for departments by name
 * @param db Database instance
 * @param searchTerm Search term
 * @returns Array of departments matching the search term
 */
export async function searchDepartments(db: SQLiteDatabase, searchTerm: string): Promise<Department[]> {
    try {
        const departments = await db.getAllAsync<Department>(
            `SELECT * FROM departments WHERE name LIKE ? ORDER BY name`,
            `%${searchTerm}%`
        );
        return departments;
    } catch (error) {
        console.error("Error searching departments:", error);
        throw error;
    }
}

/**
 * Get all students in a department by department ID
 * @param db Database instance
 * @param departmentId Department ID
 * @returns Array of students in the department
 */
export async function getStudentsInDepartmentById(db: SQLiteDatabase, departmentId: number): Promise<Student[]> {
    try {
        const students = await db.getAllAsync<Student>(
            `SELECT s.* FROM students s
             JOIN student_department sd ON s.id = sd.studentId
             WHERE sd.departmentId = ?`,
            departmentId
        );
        return students;
    } catch (error) {
        console.error(`Error getting students in department with ID ${departmentId}:`, error);
        throw error;
    }
}

