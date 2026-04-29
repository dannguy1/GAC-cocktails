import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import IngredientChecklist from './IngredientChecklist';
import { COLORS, FONTS } from '../theme';

export default function RecipeView({ cocktail, webHost }) {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    function resolveImage(path) {
        if (!path || !webHost) return null;
        if (path.startsWith('http')) return path;
        return `${webHost}${path}`;
    }

    if (!cocktail) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🍸</Text>
                <Text style={styles.emptyText}>Search for a drink above</Text>
            </View>
        );
    }

    const price = cocktail.price ? `$${cocktail.price.toFixed(2)}` : '';

    const drinkInfo = (
        <View style={styles.info}>
            <View style={styles.header}>
                <Text style={styles.name}>{cocktail.name}</Text>
                {price ? <Text style={styles.price}>{price}</Text> : null}
            </View>
            <View style={styles.divider} />
            {cocktail.glass ? (
                <Text style={styles.meta}>
                    <Text style={styles.metaLabel}>Glass: </Text>{cocktail.glass}
                </Text>
            ) : null}
            {cocktail.garnish ? (
                <Text style={styles.meta}>
                    <Text style={styles.metaLabel}>Garnish: </Text>{cocktail.garnish}
                </Text>
            ) : null}
            {cocktail.description ? (
                <Text style={styles.description}>{cocktail.description}</Text>
            ) : null}
        </View>
    );

    const recipeContent = (
        <>
            {cocktail.ingredients && cocktail.ingredients.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Ingredients</Text>
                    <IngredientChecklist cocktailId={cocktail.id} ingredients={cocktail.ingredients} />
                </View>
            )}
            {cocktail.instructions ? (
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Steps</Text>
                    <Text style={styles.instructions}>{cocktail.instructions}</Text>
                </View>
            ) : null}
        </>
    );

    if (isLandscape) {
        return (
            <View style={styles.splitRow}>
                <ScrollView style={[styles.panel, styles.panelLeft]}>
                    <Image source={{ uri: resolveImage(cocktail.image) }} style={styles.image} resizeMode="contain" />
                    {drinkInfo}
                </ScrollView>
                <View style={styles.verticalDivider} />
                <ScrollView style={[styles.panel, styles.panelRight]}>
                    {recipeContent}
                </ScrollView>
            </View>
        );
    }

    // Portrait: stack vertically
    return (
        <ScrollView style={styles.portrait}>
            <Image source={{ uri: resolveImage(cocktail.image) }} style={styles.portraitImage} resizeMode="contain" />
            {drinkInfo}
            {recipeContent}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    // Empty state
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyIcon: { fontSize: 56, opacity: 0.3, marginBottom: 12 },
    emptyText: { fontSize: 18, color: COLORS.textMuted, fontStyle: 'italic' },

    // Split layout (landscape)
    splitRow: { flex: 1, flexDirection: 'row' },
    panel: { flex: 1 },
    panelLeft: { borderRightWidth: 0 },
    panelRight: { borderLeftWidth: 0 },
    verticalDivider: { width: 1, backgroundColor: COLORS.border },

    // Image
    image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: COLORS.bg },
    portraitImage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: COLORS.bg },
    portrait: { flex: 1 },

    // Info
    info: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    name: { fontFamily: FONTS.serif, fontSize: 26, fontWeight: '600', color: COLORS.goldLight, flex: 1, lineHeight: 32 },
    price: { fontFamily: FONTS.sans, fontSize: 18, fontWeight: '700', color: COLORS.goldLight, paddingTop: 4 },
    divider: { width: 60, height: 2, backgroundColor: COLORS.gold, marginVertical: 10 },
    meta: { fontFamily: FONTS.sans, fontSize: 14, color: COLORS.textMuted, marginBottom: 4 },
    metaLabel: { fontWeight: '600' },
    description: { fontFamily: FONTS.sans, fontSize: 15, color: COLORS.textMuted, lineHeight: 22, marginTop: 12 },

    // Sections
    section: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
    sectionHeader: {
        fontFamily: FONTS.sans,
        fontWeight: '600',
        color: COLORS.gold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: 13,
        marginBottom: 10,
    },
    instructions: { fontFamily: FONTS.sans, fontSize: 16, color: COLORS.text, lineHeight: 26 },
});
