import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { PurchasedTicket } from '@/types';

interface ListForResaleModalProps {
  visible: boolean;
  ticket: PurchasedTicket | null;
  onClose: () => void;
  onConfirm: (ticket: PurchasedTicket, price: number) => void;
}

export default function ListForResaleModal({ visible, ticket, onClose, onConfirm }: ListForResaleModalProps) {
  const C = Colors.dark;
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const num = parseFloat(price);
    if (!price || isNaN(num) || num <= 0) {
      setError('Please enter a valid price.');
      return;
    }
    if (ticket && num < ticket.tierPrice * 0.5) {
      setError(`Minimum resale price is $${(ticket.tierPrice * 0.5).toFixed(0)} (50% of original).`);
      return;
    }
    setError('');
    setPrice('');
    onConfirm(ticket!, num);
  };

  const handleClose = () => {
    setPrice('');
    setError('');
    onClose();
  };

  if (!ticket) return null;

  const suggested = ticket.tierPrice * 1.1;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
          <Pressable style={[styles.sheet, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => {}}>
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: C.border }]} />

            <Text style={[styles.title, { color: C.text }]}>List for Resale</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>{ticket.eventTitle}</Text>
            <Text style={[styles.tier, { color: C.textMuted }]}>{ticket.tierName} · Qty ×{ticket.quantity}</Text>

            {/* Original price */}
            <View style={[styles.infoRow, { backgroundColor: C.background, borderColor: C.border }]}>
              <Text style={[styles.infoLabel, { color: C.textMuted }]}>Original price</Text>
              <Text style={[styles.infoValue, { color: C.text }]}>${ticket.tierPrice}</Text>
            </View>
            <View style={[styles.infoRow, { backgroundColor: C.background, borderColor: C.border }]}>
              <Text style={[styles.infoLabel, { color: C.textMuted }]}>Suggested resale price</Text>
              <Text style={[styles.infoValue, { color: Colors.dark.primary }]}>${suggested.toFixed(0)}</Text>
            </View>

            {/* Price input */}
            <Text style={[styles.inputLabel, { color: C.textSecondary }]}>Your resale price (USD)</Text>
            <View style={[styles.inputWrapper, { borderColor: error ? '#EF4444' : C.border, backgroundColor: C.background }]}>
              <Text style={[styles.dollar, { color: C.textMuted }]}>$</Text>
              <TextInput
                style={[styles.input, { color: C.text }]}
                value={price}
                onChangeText={t => { setPrice(t); setError(''); }}
                placeholder={`${suggested.toFixed(0)}`}
                placeholderTextColor={C.textMuted}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Platform fee note */}
            <View style={[styles.feeNote, { backgroundColor: '#6366F115', borderColor: '#6366F140' }]}>
              <Text style={[styles.feeNoteText, { color: '#818CF8' }]}>
                ⬡ NFT transfer secured on TON blockchain · 5% platform fee applies · Paynow payout within 24 hrs
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable style={[styles.cancelBtn, { borderColor: C.border }]} onPress={handleClose}>
                <Text style={[styles.cancelText, { color: C.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.confirmBtn, { backgroundColor: Colors.dark.primary }]} onPress={handleConfirm}>
                <Text style={styles.confirmText}>List Ticket →</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  kav: { width: '100%' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 4 },
  subtitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  tier: { fontSize: 13, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '700' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 6 },
  dollar: { fontSize: 22, fontWeight: '700', marginRight: 6 },
  input: { flex: 1, fontSize: 28, fontWeight: '800', paddingVertical: 10 },
  error: { color: '#EF4444', fontSize: 12, marginBottom: 4 },
  feeNote: { borderRadius: 10, padding: 12, borderWidth: 1, marginTop: 12, marginBottom: 20 },
  feeNoteText: { fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
  confirmBtn: { flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
