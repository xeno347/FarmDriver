import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors as tokens, spacing, typography } from '../theme/tokens';
import useThemeColors from '../theme/useThemeColors';

interface RequestModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
}

const RequestModal: React.FC<RequestModalProps> = ({ visible, onClose, title, children }) => {
  const theme = useThemeColors();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: tokens.modalOverlay }]}>
        <View style={[styles.modalContent, { backgroundColor: tokens.modalBg, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Text style={[styles.closeX, { color: tokens.closeX }]}>×</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title.toUpperCase()}</Text>
          <View style={styles.contentArea}>{children}</View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '88%',
    alignItems: 'stretch',
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    color: tokens.text,
    fontWeight: '800',
    fontSize: typography.h2,
    marginBottom: spacing.xs,
    letterSpacing: 0.6,
    alignSelf: 'flex-start',
  },
  closeButton: {
    marginTop: spacing.md,
    backgroundColor: tokens.accentGreen,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    color: tokens.text,
    fontWeight: 'bold',
    fontSize: 15,
  },
  closeIcon: {
    position: 'absolute',
    right: 12,
    top: 10,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  closeX: { fontSize: 22, fontWeight: '600' },
  contentArea: { marginTop: 6 },
});

export default RequestModal;
