import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Save a value securely to the device's keychain/keystore.
 * @param key The key to store the value under.
 * @param value The string value to store.
 */
export const saveSecurely = async (key: string, value: string) => {
    if (Platform.OS === 'web') return; // Not supported on web
    try {
        await SecureStore.setItemAsync(key, value);
    } catch (error) {
        console.error('SecureStore save error:', error);
    }
};

/**
 * Retrieve a value securely.
 * @param key The key to retrieve.
 */
export const getSecurely = async (key: string) => {
    if (Platform.OS === 'web') return null;
    try {
        return await SecureStore.getItemAsync(key);
    } catch (error) {
        console.error('SecureStore get error:', error);
        return null;
    }
};

/**
 * Delete a value securely.
 * @param key The key to delete.
 */
export const deleteSecurely = async (key: string) => {
    if (Platform.OS === 'web') return;
    try {
        await SecureStore.deleteItemAsync(key);
    } catch (error) {
        console.error('SecureStore delete error:', error);
    }
};
