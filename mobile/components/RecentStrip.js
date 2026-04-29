import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { resolveImageUrl } from '../services/storage';
import { COLORS, FONTS } from '../theme';

export default function RecentStrip({ recentCocktails, onSelect }) {
    if (!recentCocktails || recentCocktails.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Recent</Text>
            <FlatList
                data={recentCocktails}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.strip}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => onSelect(item)}
                        activeOpacity={0.7}
                        accessibilityLabel={`View ${item.name} recipe`}
                        accessibilityRole="button"
                    >
                        {resolveImageUrl(item.image)
                            ? <Image source={{ uri: resolveImageUrl(item.image) }} style={styles.thumb} />
                            : <View style={styles.thumb} />
                        }
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
    label: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingHorizontal: 8,
        paddingTop: 6,
    },
    strip: { paddingHorizontal: 8, paddingVertical: 6, gap: 8 },
    card: {
        width: 88,
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 6,
    },
    thumb: { width: 72, height: 72, borderRadius: 8 },
    name: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 4,
        width: '100%',
    },
});
