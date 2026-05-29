"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  b2c_reward_percent?: number;
  b2b_commission_percent?: number;
  stock_count?: number;
  original_price?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantityToAdd?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalOriginalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('churun_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('churun_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: any, quantityToAdd: number = 1) => {
    const existing = cart.find(item => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    
    if (product.stock_count !== undefined) {
      if (product.stock_count <= 0) {
        alert('該商品已售完！');
        return;
      }
      if (currentQty + quantityToAdd > product.stock_count) {
        alert('庫存不足，無法加入更多數量！');
        return;
      }
    }

    setCart(prev => {
      const existingInPrev = prev.find(item => item.id === product.id);
      if (existingInPrev) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantityToAdd, stock_count: product.stock_count } : item
        );
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: quantityToAdd,
        image_url: product.image_url,
        b2c_reward_percent: product.b2c_reward_percent,
        b2b_commission_percent: product.b2b_commission_percent,
        stock_count: product.stock_count,
        original_price: product.original_price
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const existing = cart.find(item => item.id === productId);
    if (existing && existing.stock_count !== undefined && quantity > existing.stock_count) {
      alert('庫存不足，無法加入更多數量！');
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const finalQty = (item.stock_count !== undefined && quantity > item.stock_count) ? item.stock_count : quantity;
        return { ...item, quantity: finalQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalOriginalPrice = cart.reduce((sum, item) => sum + ((item.original_price || item.price) * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      totalItems, 
      totalPrice,
      totalOriginalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
