import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

/**
 * Safely request media library permissions with proper error handling
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  try {
    // Check current permission first
    const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (currentPermission.granted) {
      return true;
    }

    // Request permission
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert(
        'Permission requise',
        'Accès à la galerie nécessaire pour importer une image. Veuillez autoriser l\'accès dans les paramètres.'
      );
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('Permission request error:', error);
    Toast.show({
      type: 'error',
      text1: 'Erreur de permission',
      text2: 'Impossible de demander l\'accès à la galerie'
    });
    return false;
  }
};

/**
 * Safely launch image library picker with comprehensive error handling
 */
export const pickImageFromLibrary = async (): Promise<string | null> => {
  try {
    // Verify module is available
    if (!ImagePicker.launchImageLibraryAsync) {
      throw new Error('ImagePicker module not available');
    }

    // Request permissions first
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      return null;
    }

    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) {
      return null;
    }

    if (!result.assets || result.assets.length === 0) {
      throw new Error('No image selected');
    }

    const imageAsset = result.assets[0];
    if (!imageAsset.uri) {
      throw new Error('Image URI not available');
    }

    // Convert to base64
    try {
      const base64 = imageAsset.base64 ?? await FileSystem.readAsStringAsync(
        imageAsset.uri,
        { encoding: 'base64' }
      );

      if (!base64) {
        throw new Error('Failed to convert image to base64');
      }

      // Check size limit
      if (base64.length > 2_000_000) {
        Alert.alert(
          'Image trop volumineuse',
          'L\'image dépasse 2 Mo après conversion. Choisissez une image plus petite.'
        );
        return null;
      }

      const mimeType = imageAsset.mimeType || 'image/jpeg';
      const base64Uri = `data:${mimeType};base64,${base64}`;
      Toast.show({
        type: 'success',
        text1: 'Image importée',
        text2: 'Image prête à être sauvegardée'
      });

      return base64Uri;
    } catch (error: any) {
      console.error('Error converting image to base64:', error);
      Alert.alert(
        'Erreur de conversion',
        `Impossible de convertir l'image: ${error?.message || error}`
      );
      return null;
    }
  } catch (error: any) {
    console.error('ImagePicker error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('Module not found') || error.message?.includes('not available')) {
      Alert.alert(
        'Module indisponible',
        'Le module de galerie n\'est pas disponible. Vérifiez que le build inclut expo-image-picker.'
      );
    } else {
      Alert.alert(
        'Erreur d\'importation',
        `${error?.message || error}`
      );
    }
    
    return null;
  }
};

export default {
  pickImageFromLibrary,
  requestMediaLibraryPermission,
};
