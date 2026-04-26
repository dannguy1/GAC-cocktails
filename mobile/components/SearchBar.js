import React, { useState, useRef } from 'react';
import { View, TextInput, FlatList, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { searchCocktails } from '../services/search';
import { resolveImageUrl } from '../services/storage';
import { COLORS, FONTS } from '../theme';

export default function SearchBar({ onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const timerRef = useRef(null);

    const handleChange = (text) => {
        setQuery(text);
        clearTimeout(timerRef.current);
        if (!text.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }
        timerRef.current = setTimeout(() => {
            setResults(searchCocktails(text, 6));
            setHasSearched(true);
        }, 120);
    };

    const handleSelect = (cocktail) => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
        onSelect(cocktail);
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Search drinks..."
                placeholderTextColor={COLORS.textMuted}
                value={query}
                onChangeText={handleChange}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
            />
            {results.length > 0 && (
                <View style={styles.dropdown}>
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.resultItem}
                                onPress={() => handleSelect(item)}
                                activeOpacity={0.7}
                            >
                                <Image source={{ uri: resolveImageUrl(item.image) }} style={styles.thumb} />
                                <Text style={styles.resultName}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
            {hasSearched && results.length === 0 && (
                <View style={styles.dropdown}>
                    <Text style={styles.noResults}>No matches found</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { position: 'relative', zIndex: 100 },
    input: {
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        color: COLORS.text,
        fontFamily: FONTS.sans,
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        minHeight: 48,
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.gold,
        borderRadius: 8,
        marginTop: 4,
        maxHeight: 320,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        zIndex: 200,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 48,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    thumb: { width: 48, height: 48, borderRadius: 4, marginRight: 12 },
    resultName: { fontFamily: FONTS.sans, fontSize: 16, color: COLORS.text, flex: 1 },
    noResults: {
        padding: 16,
        fontFamily: FONTS.sans,
        fontSize: 16,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});
