import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, DeviceEventEmitter } from 'react-native';
import { OrderService } from '../services/orders';
import { COLORS, FONTS } from '../theme';

export default function CustomerBar({ cocktail }) {
    const [customers, setCustomers] = useState([]);
    const [feedback, setFeedback] = useState(null); // customerId that just ordered
    const [busy, setBusy] = useState(false); // guard against double-tap

    useEffect(() => {
        OrderService.getCustomers().then(setCustomers);
        const sub = DeviceEventEmitter.addListener('customers-updated', (e) => {
            setCustomers(e.customers);
        });
        return () => sub.remove();
    }, []);

    async function handleAdd() {
        if (busy) return;
        setBusy(true);
        try {
            const customer = await OrderService.addCustomer();
            if (cocktail) {
                await OrderService.addOrder(cocktail, customer);
                showFeedback(customer.id);
            }
        } finally {
            setBusy(false);
        }
    }

    async function handleSelect(customer) {
        if (!cocktail || busy) return;
        setBusy(true);
        try {
            await OrderService.addOrder(cocktail, customer);
            showFeedback(customer.id);
        } finally {
            setBusy(false);
        }
    }

    function showFeedback(customerId) {
        setFeedback(customerId);
        setTimeout(() => setFeedback(null), 1200);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>CUSTOMERS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <TouchableOpacity style={styles.addBtn} onPress={handleAdd} accessibilityLabel="Add customer">
                    <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
                {customers.map(c => (
                    <TouchableOpacity
                        key={c.id}
                        style={[
                            styles.customerBtn,
                            feedback === c.id && styles.customerBtnActive,
                        ]}
                        onPress={() => handleSelect(c)}
                        disabled={!cocktail || feedback === c.id}
                        accessibilityLabel={`Customer ${c.number}`}
                    >
                        <Text style={[
                            styles.customerNum,
                            feedback === c.id && styles.customerNumActive,
                        ]}>
                            {feedback === c.id ? '✓' : c.number}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 8,
    },
    label: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.gold,
        letterSpacing: 1,
    },
    scroll: {
        alignItems: 'center',
        gap: 6,
        paddingRight: 8,
    },
    customerBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.bg,
        borderWidth: 2,
        borderColor: COLORS.gold,
        alignItems: 'center',
        justifyContent: 'center',
    },
    customerBtnActive: {
        backgroundColor: COLORS.green,
        borderColor: COLORS.green,
    },
    customerNum: {
        fontFamily: FONTS.sans,
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.gold,
    },
    customerNumActive: {
        color: '#fff',
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.gold,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginTop: -2,
    },
});
