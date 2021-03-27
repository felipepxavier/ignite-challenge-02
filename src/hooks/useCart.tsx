import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart =  localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });
 
 



  const addProduct = async (productId: number) => {
    try {
    
      const isExisting = cart.find(item => item.id === productId);

              if (!isExisting) {
                const { data: product } = await api.get<Product>(`products/${productId}`)
                const { data: stock } = await api.get<Stock>(`stock/${productId}`)

                if (stock.amount > 0) {
                  setCart([...cart, { ...product, amount: 1 }])
                    localStorage.setItem('@RocketShoes:cart', 
                    JSON.stringify([...cart, { ...product, amount: 1 }])
                  )
                  return;
                }
  
              } 

              if (isExisting) {
                const { data: stock } = await api.get(`stock/${productId}`)
                if (stock.amount > isExisting.amount) {
    
                  const updatedCart = cart.map(item => item.id === productId ? {
                    ...item,
                    amount: item.amount + 1
                  } : item)

                  setCart(updatedCart)
                  localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
                  return;

                } else {
                  toast.error('Quantidade solicitada fora de estoque')
                }
              }
              
    } catch (error) {
      toast.error('Erro na adição do produto');
    
    }
   
  };

  const removeProduct = (productId: number) => {
    try {  
      const isExisting = cart.some(item => item.id === productId);
      if(isExisting){
        const novoCart = cart.filter(item => item.id !== productId);
        setCart(novoCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(novoCart));
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    try {
      const responseStock = await api.get(`/stock/${productId}`);
        if(amount !== 0 && amount <= responseStock.data.amount){
          const novoCart = cart.map(item => {
            if(item.id === productId){
              return {
                ...item,
                amount
              }
            }
            return item;
          }) 
          setCart(novoCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(novoCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
