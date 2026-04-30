import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, DeviceEventEmitter } from 'react-native';
import { OrderService } from '../services/orders';
import CustomerCartModal from './CustomerCartModal';
import { COLORS, FONTS } from '../theme';

export default function OrderPanel() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        OrderService.getActiveOrders().then(setOrders);
        OrderService.getCustomers().then(setCustomers);
        const orderSub = DeviceEventEmitter.addListener('order-updated', (e) => {
            setOrders(e.orders);
        });
        const custSub = DeviceEventEmitter.addListener('customers-updated', (e) => {
            setCustomers(e.customers);
            // Clear selected customer if they were removed (tab closed)
            setSelectedCustomer(prev =>
                prev && !e.customers.some(c => c.id === prev.id) ? null : prev
            );
        });
        return () => { orderSub.remove(); custSub.remove(); };
    }, []);

    function getCustomerOrderCount(customerId) {
        return orders.filter(o => o.customerId === customerId).length;
    }

    function getCustomerOrders(customerId) {
        return orders.filter(o => o.customerId === customerId);
    }

    // Only show customers that have pending orders
    const activeCustomers = customers.filter(c => getCustomerOrderCount(c.id) > 0);

    if (activeCustomers.length === 0) return null;

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {activeCustomers.map(c => {
                    const count = getCustomerOrderCount(c.id);
                    return (
                        <TouchableOpacity
                            key={c.id}
                            style={styles.customerBtn}
                            onPress={() => setSelectedCustomer(c)}
                            accessibilityLabel={`View orders for customer ${c.number}`}
                        >
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{c.number}</Text>
                            </View>
                            {count > 0 && (
                                <View style={styles.countBadge}>
                                    <Text style={styles.countText}>{count}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
            <CustomerCartModal
                visible={!!selectedCustomer}
                customer={selectedCustomer}
                orders={selectedCustomer ? getCustomerOrders(selectedCustomer.id) : []}
                onClose={() => setSelectedCustomer(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    scroll: {
        alignItems: 'center',
        gap: 10,
    },
    customerBtn: {
        alignItems: 'center',
        position: 'relative',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.bg,
        borderWidth: 2,
        borderColor: COLORS.gold,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontFamily: FONTS.sans,
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.gold,
    },
    countBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: COLORS.gold,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    countText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
});
