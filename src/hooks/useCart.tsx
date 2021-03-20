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

  useEffect(()=> {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  }, [cart])

  const getQtdAmount = async (id: number) => {
    try {
      const responseStock = await api.get('/stock');
      const qtdStock = responseStock.data.find((item: Stock) => item.id === id);
      return qtdStock.amount;
    } catch (error) {
      return undefined
    }
  }

  const addProduct = async (productId: number) => {
    try {
     const qtdStock = await getQtdAmount(productId);
      if(qtdStock !== undefined){

        if(qtdStock > 0){
           const responseProduct = await api.get('/products');
           const produtoCorrente = responseProduct.data.find((item: Product) => item.id === productId);
           const isExisting = cart.find(item => item.id === productId);

          if(isExisting !== undefined){

            updateProductAmount({ productId, amount: isExisting.amount + 1 });
        
          } else {

            const novoCart = [...cart, {
              ...produtoCorrente,
              amount: 1
            }];
            setCart(novoCart);
          }
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {  
      const isExisting = cart.some(item => item.id === productId);
      if(isExisting){
        const novoCart = cart.filter(item => item.id !== productId);
        setCart(novoCart);
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Erro na remoção do produto.');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    try {
      const qtdStock = await getQtdAmount(productId);
      if(amount <= qtdStock ){
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
