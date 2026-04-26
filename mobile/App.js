import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, Platform, StatusBar,
    useWindowDimensions, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import SearchBar from './components/SearchBar';
import RecipeView from './components/RecipeView';
import RecentStrip from './components/RecentStrip';
import { getCocktailById } from './services/search';
import { loadRecentDrinks, saveRecentDrink, loadWebHost } from './services/storage';
import { COLORS, FONTS } from './theme';

export default function App() {
    const [selectedCocktail, setSelectedCocktail] = useState(null);
    const [recentIds, setRecentIds] = useState([]);
    const recentIdsRef = useRef(recentIds);
    recentIdsRef.current = recentIds;
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    useEffect(() => {
        loadWebHost().then(() => loadRecentDrinks()).then(setRecentIds);
    }, []);

    const handleSelect = useCallback(async (cocktail) => {
        Keyboard.dismiss();
        setSelectedCocktail(cocktail);
        const updated = await saveRecentDrink(cocktail.id, recentIdsRef.current);
        setRecentIds(updated);
    }, []);

    const recentCocktails = recentIds.map(id => getCocktailById(id)).filter(Boolean);

    return (
        <SafeAreaProvider>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.surface} />

            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.brand}>
                            <Text style={styles.brandIcon}>🍸</Text>
                            <Text style={styles.brandTitle}>GAC Bartender</Text>
                        </View>
                        <View style={styles.searchWrap}>
                            <SearchBar onSelect={handleSelect} />
                        </View>
                    </View>

                    {/* Main content — split view for recipe */}
                    <View style={styles.content}>
                        <RecipeView cocktail={selectedCocktail} />
                    </View>

                    {/* Recent drinks footer */}
                    <RecentStrip recentCocktails={recentCocktails} onSelect={handleSelect} />
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        zIndex: 20,
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandIcon: { fontSize: 22 },
    brandTitle: {
        fontFamily: FONTS.serif,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.goldLight,
    },
    searchWrap: { flex: 1 },

    // Content
    content: { flex: 1 },
});
