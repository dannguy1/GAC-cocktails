import React, { useState, useEffect } from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { getWebHost, saveWebHost } from '../services/storage';
import { COLORS, FONTS } from '../theme';

export default function SettingsModal({ visible, onClose, onSave }) {
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (visible) setUrl(getWebHost());
    }, [visible]);

    const handleSave = async () => {
        const trimmed = url.trim();
        if (!trimmed) return;
        await saveWebHost(trimmed);
        onSave?.(trimmed);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.sheet}>
                    <Text style={styles.title}>Backend URL</Text>
                    <Text style={styles.label}>
                        Web server address (host + port) for cocktail images:
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={url}
                        onChangeText={setUrl}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        placeholder="http://192.168.x.x:8510"
                        placeholderTextColor={COLORS.textMuted}
                        selectTextOnFocus
                    />
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
                            <Text style={styles.btnCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                            <Text style={styles.btnSaveText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    sheet: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 24,
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.goldLight,
        marginBottom: 12,
    },
    label: {
        fontFamily: FONTS.sans,
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 10,
        lineHeight: 20,
    },
    input: {
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        color: COLORS.text,
        fontFamily: FONTS.sans,
        fontSize: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        minHeight: 48,
        marginBottom: 20,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    btnCancel: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 48,
        justifyContent: 'center',
    },
    btnCancelText: {
        fontFamily: FONTS.sans,
        fontSize: 16,
        color: COLORS.textMuted,
    },
    btnSave: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: COLORS.gold,
        minHeight: 48,
        justifyContent: 'center',
    },
    btnSaveText: {
        fontFamily: FONTS.sans,
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.bg,
    },
});
