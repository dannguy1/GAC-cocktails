import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { loadChecklist, saveChecklist } from '../services/storage';
import { COLORS, FONTS } from '../theme';

export default function IngredientChecklist({ cocktailId, ingredients }) {
    const [checked, setChecked] = useState(new Set());

    useEffect(() => {
        if (cocktailId) {
            loadChecklist(cocktailId).then(setChecked);
        } else {
            setChecked(new Set());
        }
    }, [cocktailId]);

    const toggle = useCallback((index) => {
        setChecked(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            saveChecklist(cocktailId, next);
            return next;
        });
    }, [cocktailId]);

    if (!ingredients || ingredients.length === 0) return null;

    return (
        <View style={styles.container}>
            {ingredients.map((ing, i) => {
                const isChecked = checked.has(i);
                return (
                    <TouchableOpacity
                        key={ing.raw}
                        style={styles.row}
                        onPress={() => toggle(i)}
                        activeOpacity={0.7}
                        accessibilityLabel={`${isChecked ? 'Uncheck' : 'Check'} ${ing.raw}`}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isChecked }}
                    >
                        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                            {isChecked && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={[styles.text, isChecked && styles.textChecked]}>
                            {ing.raw}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {},
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderWidth: 2,
        borderColor: COLORS.gold,
        borderRadius: 4,
        marginRight: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.success,
        borderColor: COLORS.success,
    },
    checkmark: { color: '#fff', fontSize: 16, fontWeight: '700' },
    text: {
        fontFamily: FONTS.sans,
        fontSize: 16,
        color: COLORS.text,
        flex: 1,
    },
    textChecked: {
        opacity: 0.4,
        textDecorationLine: 'line-through',
    },
});
