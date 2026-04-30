import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { OrderService } from '../services/orders';
import { COLORS, FONTS } from '../theme';

export default function CustomerCartModal({ visible, customer, orders, onClose }) {
    if (!customer) return null;

    const total = orders.reduce((s, o) => s + (o.price || 0), 0);

    // Group orders by cocktailId with count
    function groupItems() {
        const map = {};
        for (const o of orders) {
            if (!map[o.cocktailId]) {
                map[o.cocktailId] = {
                    cocktailId: o.cocktailId,
                    cocktailName: o.cocktailName,
                    price: o.price || 0,
                    count: 0,
                    orderIds: [],
                };
            }
            map[o.cocktailId].count++;
            map[o.cocktailId].orderIds.push(o.id);
        }
        return Object.values(map);
    }

    async function handleAdd(item) {
        // Add another of the same drink for this customer
        await OrderService.addOrder(
            { id: item.cocktailId, name: item.cocktailName, price: item.price },
            customer
        );
    }

    async function handleRemoveOne(item) {
        // Remove the most recent order of this drink
        const lastId = item.orderIds[item.orderIds.length - 1];
        await OrderService.removeOrder(lastId);
    }

    async function handleCloseTab() {
        Alert.alert(
            'Close Tab',
            `Close tab for Customer ${customer.number}? This will clear all their orders.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Close Tab',
                    style: 'destructive',
                    onPress: async () => {
                        await OrderService.completeCustomerOrders(customer.id);
                        onClose();
                    },
                },
            ]
        );
    }

    const items = groupItems();

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{customer.number}</Text>
                            </View>
                            <Text style={styles.title}>Customer {customer.number}</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Order items grouped */}
                    <ScrollView style={styles.list}>
                        {items.length === 0 ? (
                            <Text style={styles.emptyText}>No items</Text>
                        ) : (
                            items.map(item => (
                                <View key={item.cocktailId} style={styles.item}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName} numberOfLines={1}>{item.cocktailName}</Text>
                                        {item.price > 0 && (
                                            <Text style={styles.itemPrice}>${(item.price * item.count).toFixed(2)}</Text>
                                        )}
                                    </View>
                                    <View style={styles.counter}>
                                        <TouchableOpacity
                                            style={styles.counterBtn}
                                            onPress={() => handleRemoveOne(item)}
                                            accessibilityLabel={`Decrease ${item.cocktailName}`}
                                        >
                                            <Text style={styles.counterBtnText}>−</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.countText}>{item.count}</Text>
                                        <TouchableOpacity
                                            style={styles.counterBtn}
                                            onPress={() => handleAdd(item)}
                                            accessibilityLabel={`Increase ${item.cocktailName}`}
                                        >
                                            <Text style={styles.counterBtnText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    {/* Footer — total & close tab */}
                    <View style={styles.footer}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity style={styles.closeTabBtn} onPress={handleCloseTab}>
                            <Text style={styles.closeTabText}>Close Tab</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.gold,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontFamily: FONTS.sans,
        fontSize: 16,
        fontWeight: '700',
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: 20,
        color: COLORS.goldLight,
        fontWeight: '600',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: {
        color: COLORS.textMuted,
        fontSize: 16,
    },
    list: {
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    emptyText: {
        color: COLORS.textMuted,
        fontFamily: FONTS.sans,
        fontSize: 15,
        textAlign: 'center',
        padding: 24,
        fontStyle: 'italic',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        gap: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontFamily: FONTS.sans,
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    itemPrice: {
        fontFamily: FONTS.sans,
        fontSize: 13,
        color: COLORS.goldLight,
        fontWeight: '600',
        marginTop: 2,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    counterBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.gold,
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterBtnText: {
        color: COLORS.gold,
        fontSize: 20,
        fontWeight: '700',
        marginTop: -1,
    },
    countText: {
        fontFamily: FONTS.sans,
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        minWidth: 28,
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    totalLabel: {
        fontFamily: FONTS.sans,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    totalAmount: {
        fontFamily: FONTS.sans,
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.goldLight,
    },
    closeTabBtn: {
        backgroundColor: COLORS.green,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        minHeight: 48,
        justifyContent: 'center',
    },
    closeTabText: {
        color: '#fff',
        fontFamily: FONTS.sans,
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
