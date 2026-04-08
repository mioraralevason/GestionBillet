# Professional Popup Components Guide

This guide shows how to replace native `Alert.alert()` with professional, themed popup components.

## Components Available

### 1. ConfirmModal
A beautiful confirmation modal with animations and theme support.

**Features:**
- Smooth scale and fade animations
- 5 types: `primary`, `danger`, `success`, `warning`, `info`
- Customizable icons based on type
- Professional color scheme
- Optional cancel button

**Usage:**
```tsx
import ConfirmModal from '../components/ConfirmModal';

const [modalVisible, setModalVisible] = useState(false);

// In your JSX:
<ConfirmModal
  visible={modalVisible}
  title="Supprimer l'acheteur"
  message="Êtes-vous sûr de vouloir supprimer cet acheteur ?"
  onConfirm={() => {
    // Do delete operation
    setModalVisible(false);
  }}
  onCancel={() => setModalVisible(false)}
  confirmText="Supprimer"
  type="danger"
/>
```

### 2. ToastMessage
A slide-in toast notification for success/error/info messages.

**Features:**
- Slide-down animation from top
- Auto-dismiss after duration (default: 3000ms)
- Manual close button
- 4 types: `success`, `error`, `warning`, `info`
- Icon and color themed

**Usage:**
```tsx
import ToastMessage from '../components/ToastMessage';

const [toastVisible, setToastVisible] = useState(false);
const [toastConfig, setToastConfig] = useState({
  title: '',
  message: '',
  type: 'info' as 'success' | 'error' | 'warning' | 'info'
});

// Show toast:
setToastConfig({
  title: 'Succès',
  message: 'Opération réussie!',
  type: 'success'
});
setToastVisible(true);

// In your JSX:
<ToastMessage
  visible={toastVisible}
  title={toastConfig.title}
  message={toastConfig.message}
  type={toastConfig.type}
  onClose={() => setToastVisible(false)}
/>
```

## Migration Examples

### Before (Alert.alert):
```tsx
import { Alert } from 'react-native';

// Simple message
Alert.alert('Erreur', 'Le nom est obligatoire.');

// Success message
Alert.alert('Succès', 'Acheteur ajouté avec succès.');

// Confirmation dialog
Alert.alert(
  "Supprimer",
  "Supprimer cet acheteur ?",
  [
    { text: "Annuler", style: "cancel" },
    { 
      text: "Supprimer", 
      style: "destructive", 
      onPress: () => deleteItem() 
    }
  ]
);
```

### After (Professional Popups):
```tsx
import ConfirmModal from '../components/ConfirmModal';
import ToastMessage from '../components/ToastMessage';

// State
const [deleteModalVisible, setDeleteModalVisible] = useState(false);
const [toastVisible, setToastVisible] = useState(false);
const [toastConfig, setToastConfig] = useState({
  title: '',
  message: '',
  type: 'success' as 'success' | 'error' | 'warning' | 'info'
});

// Simple error toast
const showError = () => {
  setToastConfig({ title: 'Erreur', message: 'Le nom est obligatoire.', type: 'error' });
  setToastVisible(true);
};

// Success toast
const showSuccess = () => {
  setToastConfig({
    title: 'Succès',
    message: 'Acheteur ajouté avec succès.',
    type: 'success'
  });
  setToastVisible(true);
};

// Confirmation modal
const showDeleteConfirm = () => {
  setDeleteModalVisible(true);
};

const handleDelete = () => {
  deleteItem();
  setToastConfig({
    title: 'Succès',
    message: 'Acheteur supprimé avec succès.',
    type: 'success'
  });
  setToastVisible(true);
  setDeleteModalVisible(false);
};

// In your JSX:
<ConfirmModal
  visible={deleteModalVisible}
  title="Supprimer l'acheteur"
  message="Êtes-vous sûr de vouloir supprimer cet acheteur ?"
  onConfirm={handleDelete}
  onCancel={() => setDeleteModalVisible(false)}
  confirmText="Supprimer"
  type="danger"
/>

<ToastMessage
  visible={toastVisible}
  title={toastConfig.title}
  message={toastConfig.message}
  type={toastConfig.type}
  onClose={() => setToastVisible(false)}
/>
```

## Type Configuration

### ConfirmModal Types:
- `primary` - Purple (#6366F1) - General confirmations
- `danger` - Red (#EF4444) - Destructive actions
- `success` - Green (#10B981) - Success confirmations
- `warning` - Orange (#F59E0B) - Warning messages
- `info` - Blue (#3B82F6) - Information messages

### ToastMessage Types:
- `success` - Green (#10B981) - Success notifications
- `error` - Red (#EF4444) - Error notifications
- `warning` - Orange (#F59E0B) - Warning notifications
- `info` - Blue (#3B82F6) - Information notifications

## Common Patterns

### Pattern 1: Form Validation
```tsx
const handleSubmit = () => {
  if (!name.trim()) {
    setToastConfig({ title: 'Erreur', message: 'Le nom est obligatoire.', type: 'error' });
    setToastVisible(true);
    return;
  }
  
  if (success) {
    setToastConfig({ title: 'Succès', message: 'Enregistré avec succès.', type: 'success' });
    setToastVisible(true);
  }
};
```

### Pattern 2: Delete Confirmation
```tsx
const [deleteModalVisible, setDeleteModalVisible] = useState(false);
const [itemToDelete, setItemToDelete] = useState(null);

const confirmDelete = (item) => {
  setItemToDelete(item);
  setDeleteModalVisible(true);
};

const handleDelete = () => {
  if (itemToDelete) {
    deleteItem(itemToDelete.id);
    setToastConfig({ title: 'Succès', message: 'Élément supprimé.', type: 'success' });
    setToastVisible(true);
  }
  setDeleteModalVisible(false);
  setItemToDelete(null);
};
```

### Pattern 3: Async Operations
```tsx
const handleAsyncOperation = async () => {
  try {
    const result = await someAsyncOperation();
    
    if (result.success) {
      setToastConfig({ title: 'Succès', message: 'Opération réussie!', type: 'success' });
      setToastVisible(true);
    } else {
      setToastConfig({ title: 'Erreur', message: result.message, type: 'error' });
      setToastVisible(true);
    }
  } catch (error) {
    setToastConfig({ title: 'Erreur', message: 'Une erreur est survenue.', type: 'error' });
    setToastVisible(true);
  }
};
```

## Files Already Updated

- ✅ `app/(tabs)/buyers.tsx` - Uses ConfirmModal for delete + ToastMessage for notifications
- ✅ `app/profile.tsx` - Uses ToastMessage for PIN update notifications

## Files Needing Updates

The following files still use `Alert.alert()` and should be migrated:

- `app/index.tsx`
- `app/assign-ticket/[id].tsx`
- `app/assign-ticket/batch.tsx`
- `app/event/[id].tsx`
- `app/event/[id]/generate.tsx`
- `app/tickets/[eventId].tsx`

## Tips

1. **Always show success toasts** after successful operations
2. **Use error toasts** for validation errors and failures
3. **Use ConfirmModal** for destructive actions (delete, reset, etc.)
4. **Use warning toasts** for important but non-critical information
5. **Keep messages concise** - users scan, don't read
6. **Use appropriate icons** - they convey meaning faster than text
