/**
 * Order Service — manages drink orders with localStorage persistence.
 * Orders have: id, cocktailId, cocktailName, price, timestamp, status, customerId, customerName
 * Customers have: id, name
 */

const STORAGE_KEY = 'gac-orders';
const CUSTOMERS_KEY = 'gac-customers';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function loadCustomers() {
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomers(customers) {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

function emitUpdate() {
  const orders = loadOrders();
  document.dispatchEvent(new CustomEvent('order-updated', {
    detail: { orders: orders.filter(o => o.status === 'pending') }
  }));
}

export const OrderService = {
  getOrders() {
    return loadOrders();
  },

  getActiveOrders() {
    return loadOrders().filter(o => o.status === 'pending');
  },

  getCustomers() {
    return loadCustomers();
  },

  addCustomer(name) {
    const customers = loadCustomers();
    const customer = { id: generateId(), name: name.trim() };
    customers.push(customer);
    saveCustomers(customers);
    document.dispatchEvent(new CustomEvent('customers-updated', {
      detail: { customers }
    }));
    return customer;
  },

  removeCustomer(customerId) {
    let customers = loadCustomers();
    customers = customers.filter(c => c.id !== customerId);
    saveCustomers(customers);
    document.dispatchEvent(new CustomEvent('customers-updated', {
      detail: { customers }
    }));
  },

  addOrder(cocktail, customer) {
    const orders = loadOrders();
    const order = {
      id: generateId(),
      cocktailId: cocktail.id,
      cocktailName: cocktail.name,
      price: cocktail.price || 0,
      customerId: customer.id,
      customerName: customer.name,
      timestamp: Date.now(),
      status: 'pending'
    };
    orders.push(order);
    saveOrders(orders);
    emitUpdate();
    return order;
  },

  completeOrder(orderId) {
    const orders = loadOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'completed';
      saveOrders(orders);
      emitUpdate();
    }
  },

  completeCustomerOrders(customerId) {
    const orders = loadOrders();
    orders.forEach(o => {
      if (o.customerId === customerId && o.status === 'pending') {
        o.status = 'completed';
      }
    });
    saveOrders(orders);
    emitUpdate();
  },

  removeOrder(orderId) {
    let orders = loadOrders();
    orders = orders.filter(o => o.id !== orderId);
    saveOrders(orders);
    emitUpdate();
  },

  clearCompleted() {
    let orders = loadOrders();
    orders = orders.filter(o => o.status !== 'completed');
    saveOrders(orders);
    emitUpdate();
  }
};
