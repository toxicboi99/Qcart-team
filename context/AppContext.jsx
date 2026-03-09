'use client'
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createSession,
  getUserSession,
  setUserSession,
  clearUserSession,
  isSessionValid,
  getSessionInfo,
  SESSION_CHECK_INTERVAL_MS,
} from "@/lib/session";

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = (props) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY || '$'
    const router = useRouter()

    const [products, setProducts] = useState([])
    const [userData, setUserData] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [cartItems, setCartItems] = useState({})
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [authLoading, setAuthLoading] = useState(true)
    const [sessionInfo, setSessionInfo] = useState(null) // { loginAt, expiresAt, remainingMs }


    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

    const fetchProductData = async () => {
        try {
            const res = await fetch(`${API_URL}/api/products`)
            const data = await res.json()
            setProducts(Array.isArray(data) ? data : [])
        } catch {
            setProducts([])
        }
    }


    const fetchUserData = () => {
        const session = getUserSession();
        if (session && isSessionValid(session)) {
            setUserData(session.user);
            setIsAuthenticated(true);
            setIsAdmin(session.user.role === 'admin' || session.user.role === 'seller' || false);
            setSessionInfo(getSessionInfo(session));
        } else {
            if (session) clearUserSession();
            setUserData(null);
            setIsAuthenticated(false);
            setIsAdmin(false);
            setSessionInfo(null);
        }
        setAuthLoading(false);
    }



    const login = async (email, password) => {

        try {

            const response = await fetch(
                `${API_URL}/api/users/signin`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                const session = createSession(data.user);
                setUserSession(session);
                setUserData(data.user);
                setIsAuthenticated(true);
                setIsAdmin(data.user.role === 'admin' || data.user.role === 'seller' || false);
                setSessionInfo(getSessionInfo(session));
                toast.success('Signed in successfully!');
                return { success: true };
            }

            else {

                toast.error(data.error || 'Sign in failed');

                return { success: false };

            }

        }

        catch (error) {

            toast.error('Failed to connect to server');

            return { success: false };

        }

    }



    const logout = () => {
        clearUserSession();
        setUserData(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setCartItems({});
        setSessionInfo(null);
        toast.success('Logged out successfully');
        router.push('/');
    }



    const addToCart = async (itemId) => {

        if (!isAuthenticated) {

            toast.error('Please sign in to add items to cart');

            router.push('/signin');

            return;

        }

        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {

            cartData[itemId] += 1;

        }

        else {

            cartData[itemId] = 1;

        }

        setCartItems(cartData);

        toast.success('Item added to cart!');

    }



    const updateCartQuantity = async (itemId, quantity) => {

        let cartData = structuredClone(cartItems);

        if (quantity === 0) {

            delete cartData[itemId];

        }

        else {

            cartData[itemId] = quantity;

        }

        setCartItems(cartData)

    }



    const getCartCount = () => {

        let totalCount = 0;

        for (const items in cartItems) {

            if (cartItems[items] > 0) {

                totalCount += cartItems[items];

            }

        }

        return totalCount;

    }



    const getCartAmount = () => {

        let totalAmount = 0;

        for (const items in cartItems) {

            let itemInfo = products.find(
                (product) => product._id === items
            );

            if (cartItems[items] > 0 && itemInfo) {

                totalAmount +=
                    itemInfo.offerPrice *
                    cartItems[items];

            }

        }

        return Math.floor(totalAmount * 100) / 100;

    }



    const handleBuyNow = (itemId) => {

        if (!isAuthenticated) {

            toast.error('Please sign in to continue');

            router.push('/signin');

            return;

        }

        addToCart(itemId);

        router.push('/cart');

    }



    useEffect(() => {
        fetchProductData();
        fetchUserData();
    }, []);

    // Session expiry check - auto logout when session expires
    useEffect(() => {
        if (!isAuthenticated) return;
        const interval = setInterval(() => {
            const session = getUserSession();
            if (!session || !isSessionValid(session)) {
                clearUserSession();
                setUserData(null);
                setIsAuthenticated(false);
                setIsAdmin(false);
                setSessionInfo(null);
                toast.error('Session expired. Please sign in again.');
                router.push('/signin');
            } else {
                setSessionInfo(getSessionInfo(session));
            }
        }, SESSION_CHECK_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [isAuthenticated, router])



    useEffect(() => {

        const savedCart = localStorage.getItem('cart');

        if (savedCart) {

            try {

                setCartItems(JSON.parse(savedCart));

            }

            catch (error) {

                console.error('Error loading cart:', error);

            }

        }

    }, [])



    useEffect(() => {

        if (Object.keys(cartItems).length > 0) {

            localStorage.setItem(
                'cart',
                JSON.stringify(cartItems)
            );

        }

    }, [cartItems])



    const value = {

        currency, router,

        isAdmin, setIsAdmin,

        userData, fetchUserData, sessionInfo,

        products, fetchProductData,

        cartItems, setCartItems,

        addToCart, updateCartQuantity,

        getCartCount, getCartAmount,

        isAuthenticated,

        authLoading, // ✅ ADDED

        login, logout,

        handleBuyNow

    }



    return (

        <AppContext.Provider value={value}>

            {props.children}

        </AppContext.Provider>

    )

}