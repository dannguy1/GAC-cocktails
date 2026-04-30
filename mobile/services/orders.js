import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const ORDERS_KEY = 'gac-orders';
const CUSTOMERS_KEY = 'gac-customers';
const NEXT_NUM_KEY = 'gac-next-customer-num';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function loadOrders() {
    try {
        const raw = await AsyncStorage.getItem(ORDERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

async function saveOrders(orders) {
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

async function loadCustomers() {
    try {
        const raw = await AsyncStorage.getItem(CUSTOMERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

async function saveCustomers(customers) {
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

async function getNextNumber() {
    try {
        const raw = await AsyncStorage.getItem(NEXT_NUM_KEY);
        return raw ? parseInt(raw, 10) : 1;
    } catch {
        return 1;
    }
}

async function setNextNumber(num) {
    await AsyncStorage.setItem(NEXT_NUM_KEY, String(num));
}

function emitUpdate(orders) {
    const active = orders.filter(o => o.status === 'pending');
    DeviceEventEmitter.emit('order-updated', { orders: active });
}

function emitCustomers(customers) {
    DeviceEventEmitter.emit('customers-updated', { customers });
}

export const OrderService = {
    async getActiveOrders() {
        const orders = await loadOrders();
        return orders.filter(o => o.status === 'pending');
    },

    async getCustomers() {
        return await loadCustomers();
    },

    async addCustomer() {
        const customers = await loadCustomers();
        const num = await getNextNumber();
        const customer = { id: generateId(), number: num };
        customers.push(customer);
        await saveCustomers(customers);
        await setNextNumber(num + 1);
        emitCustomers(customers);
        return customer;
    },

    async removeCustomer(customerId) {
        let customers = await loadCustomers();
        customers = customers.filter(c => c.id !== customerId);
        await saveCustomers(customers);
        emitCustomers(customers);
    },

    async addOrder(cocktail, customer) {
        const orders = await loadOrders();
        const order = {
            id: generateId(),
            cocktailId: cocktail.id,
            cocktailName: cocktail.name,
            price: cocktail.price || 0,
            customerId: customer.id,
            customerNumber: customer.number,
            timestamp: Date.now(),
            status: 'pending',
        };
        orders.push(order);
        await saveOrders(orders);
        emitUpdate(orders);
        return order;
    },

    async completeOrder(orderId) {
        const orders = await loadOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'completed';
            await saveOrders(orders);
            emitUpdate(orders);
        }
    },

    async completeCustomerOrders(customerId) {
        // Remove completed orders entirely to prevent unbounded storage growth
        let orders = await loadOrders();
        orders = orders.filter(o => !(o.customerId === customerId && o.status === 'pending'));
        await saveOrders(orders);
        emitUpdate(orders);

        // Remove the customer from the active list
        let customers = await loadCustomers();
        customers = customers.filter(c => c.id !== customerId);
        await saveCustomers(customers);
        // Reset numbering when all tabs are closed
        if (customers.length === 0) {
            await setNextNumber(1);
        }
        emitCustomers(customers);
    },

    async removeOrder(orderId) {
        let orders = await loadOrders();
        orders = orders.filter(o => o.id !== orderId);
        await saveOrders(orders);
        emitUpdate(orders);
    },

    async resetCustomers() {
        await saveCustomers([]);
        await setNextNumber(1);
        await saveOrders([]);
        emitCustomers([]);
        emitUpdate([]);
    },
};
