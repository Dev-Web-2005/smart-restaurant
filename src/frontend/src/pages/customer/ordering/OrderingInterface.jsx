import React, { useState, useMemo } from "react";
// import axios from 'axios'; // Import Axios khi bạn sẵn sàng tích hợp API

// --- CONSTANTS & DATA MOCK ---
const mockCategories = [
  {
    id: 1,
    name: "Soups",
    image: "https://images3.alphacoders.com/108/1088128.jpg",
    route: "soups",
  },
  {
    id: 4,
    name: "Noodle Dishes",
    image:
      "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=500&q=80",
    route: "noodle-dishes",
  },
  {
    id: 7,
    name: "Vegetarian",
    image:
      "https://media.istockphoto.com/id/1416818056/photo/colourful-vegan-bowl-with-quinoa-and-sweet-potato.jpg?s=612x612&w=0&k=20&c=t1I58CqucV6bLRaa4iDy7PIVjnV8D9eWDjEsX9X-87k=",
    route: "vegetarian",
  },
];

const mockDishesData = {
  soups: [
    {
      id: "D4",
      name: "Tomato Soup",
      description: "Creamy classic tomato soup.",
      price: 8.0,
      image:
        "https://images.unsplash.com/photo-1547592166-23acbe3a624b?auto=format&fit=crop&w=500&q=80",
    },
  ],
  "noodle-dishes": [
    {
      id: 1,
      name: "Spicy Miso Ramen",
      description: "Ramen with a spicy miso broth, tender chashu pork.",
      price: 15.5,
      image:
        "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 2,
      name: "Classic Pad Thai",
      description: "Wok-fried rice noodles with shrimp and peanuts.",
      price: 14.0,
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCylxfP50ETWvYyVwTx3qbbPj27wYtyyW5GQ&s",
    },
  ],
};

const formatCategoryName = (slug) => {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// =========================================================
// 🚨 COMPONENT: CustomerCategoryCard
// =========================================================
const CustomerCategoryCard = ({ category, onClick }) => {
  return (
    <div
      onClick={() => onClick(category.route)}
      className="group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl"
    >
      <div className="aspect-square relative">
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white">{category.name}</h3>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// 🚨 COMPONENT: DishCard
// =========================================================
const DishCard = ({ dish, cartItems, onUpdateCart }) => {
  const cartItem = cartItems.find((item) => item.id === dish.id);
  const currentQty = cartItem ? cartItem.qty : 0;

  const handleIncrement = () => {
    onUpdateCart(dish, currentQty + 1);
  };

  const handleDecrement = () => {
    if (currentQty > 0) {
      onUpdateCart(dish, currentQty - 1);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-[#1A202C] shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={dish.image}
          alt={dish.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-1">{dish.name}</h3>
        <p className="text-sm text-[#9dabb9] mb-3 line-clamp-2">
          {dish.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-[#4ade80]">
            ${dish.price.toFixed(2)}
          </span>

          {currentQty === 0 ? (
            <button
              onClick={handleIncrement}
              className="px-4 py-2 bg-[#137fec] text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add to Cart
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDecrement}
                className="w-8 h-8 flex items-center justify-center bg-[#2D3748] text-white rounded-full hover:bg-[#4A5568] transition-colors"
              >
                −
              </button>
              <span className="text-white font-bold w-8 text-center">
                {currentQty}
              </span>
              <button
                onClick={handleIncrement}
                className="w-8 h-8 flex items-center justify-center bg-[#137fec] text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =========================================================
// 🚨 MODAL THANH TOÁN VÀ ĐẶT MÓN (CART MODAL)
// =========================================================
const CartModal = ({ isOpen, onClose, cartItems, onClearCart }) => {
  const [step, setStep] = useState("CART");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  // Tính tổng tiền
  const total = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.qty, 0),
    [cartItems]
  );

  // Đóng modal và reset trạng thái (Nếu clearCart = true, component cha sẽ xóa giỏ hàng)
  const handleClose = (shouldClearCart = false) => {
    setStep("CART");
    setQrCodeUrl(null);
    setIsOrderPlaced(false);
    setPaymentLoading(false);
    onClose(shouldClearCart);
  };

  // Hàm gọi API lấy QR Code
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setStep("PAYMENT");
    setPaymentLoading(true);

    // Comment: BẮT ĐẦU: Logic gọi API GET QR Code thanh toán
    console.log("Fetching QR code for payment...");

    // try {
    //     // API endpoint: GET /api/customer/payment/qr?amount=XX
    //     const qrRes = await axios.get(`/api/customer/payment/qr?amount=${total.toFixed(2)}`);
    //     setQrCodeUrl(qrRes.data.qrImageUrl);
    //     setStep('QR');
    // } catch (error) {
    //     alert("Failed to fetch QR code.");
    //     handleClose();
    // } finally {
    //     setPaymentLoading(false);
    // }

    // Giả lập
    setTimeout(() => {
      setQrCodeUrl(
        "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_many_purposes.svg"
      );
      setStep("QR");
      setPaymentLoading(false);
    }, 1500);
    // Comment: KẾT THÚC: Logic gọi API GET QR Code thanh toán
  };

  // Hàm gọi API Đặt món (Sau khi QR hiện ra)
  const handlePlaceOrder = async () => {
    setIsOrderPlaced(true);
    setPaymentLoading(true);

    // Comment: BẮT ĐẦU: Logic gọi API POST đặt món (Chỉ gọi sau khi QR hiện)
    const orderPayload = {
      tableId: "T101", // Giả định ID bàn
      customerNotes: "Order paid via QR code.",
      items: cartItems.map((item) => ({
        dishId: item.id,
        quantity: item.qty,
        name: item.name,
        price: item.price,
        notes: item.notes || "",
      })),
    };

    // try {
    //     // API endpoint: POST /api/customer/order/place
    //     await axios.post('/api/customer/order/place', orderPayload);
    // } catch (error) {
    //     alert('Failed to place order.');
    // } finally {
    //     setPaymentLoading(false);
    //     onClearCart(); // Xóa giỏ hàng trong component cha
    //     handleClose();
    // }

    // Giả lập
    setTimeout(() => {
      alert("Order placed successfully! (Simulated)");
      setPaymentLoading(false);
      onClearCart(); // Báo hiệu component cha clear cart
      handleClose();
    }, 2000);
    // Comment: KẾT THÚC: Logic gọi API POST đặt món
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm font-['Work_Sans',_sans-serif]">
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-[#1A202C] p-8 shadow-2xl transition-all">
        <h3 className="text-2xl font-bold text-white mb-6">
          {step === "CART" ? "Your Order" : "Order Confirmation"}
        </h3>

        {/* 1. CART VIEW */}
        {step === "CART" && (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {cartItems.length === 0 ? (
              <p className="text-[#9dabb9] text-center py-10">
                Your cart is empty.
              </p>
            ) : (
              cartItems.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-[#2D3748] p-3 rounded-lg"
                >
                  <p className="text-white font-semibold">
                    {item.qty}x {item.name}
                  </p>
                  <span className="text-base font-bold text-white">
                    ${(item.price * item.qty).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. PAYMENT/QR VIEW */}
        {(step === "PAYMENT" || step === "QR") && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            {paymentLoading && (
              <p className="text-white">Fetching QR Code...</p>
            )}
            {qrCodeUrl && (
              <>
                <img
                  src={qrCodeUrl}
                  alt="Payment QR Code"
                  className="w-56 h-56 border-4 border-white rounded-lg"
                />
                <p className="text-lg font-semibold text-white mt-4">
                  Scan the code to finalize payment
                </p>
              </>
            )}
          </div>
        )}

        {/* Footer and Actions */}
        <div className="mt-6 pt-4 border-t border-[#2D3748] flex justify-between items-center">
          <p className="text-xl font-bold text-white">
            Total:{" "}
            <span className="text-3xl font-black text-[#4ade80]">
              ${total.toFixed(2)}
            </span>
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => handleClose(false)}
              className="h-10 px-4 rounded-lg bg-[#2D3748] text-white text-sm font-bold hover:bg-[#4A5568]"
            >
              Cancel
            </button>

            {step === "CART" && (
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="h-10 px-4 rounded-lg bg-[#137fec] text-white text-sm font-bold hover:bg-[#137fec]/90 disabled:opacity-50"
              >
                Checkout
              </button>
            )}

            {step === "QR" && (
              <button
                onClick={handlePlaceOrder}
                disabled={isOrderPlaced || paymentLoading}
                className="h-10 px-4 rounded-lg bg-[#4ade80] text-black text-sm font-bold hover:bg-green-500 disabled:opacity-50"
              >
                {isOrderPlaced ? "Order Placed" : "Place Order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 🚨 COMPONENT 4: Main Interface (Controller)
// ----------------------------------------------------
const OrderManagementInterface = ({ categorySlug = "noodle-dishes" }) => {
  // 🚨 Chú ý: Component này sẽ thay thế CategoryDishes
  const [dishes, setDishes] = useState(mockDishesData[categorySlug] || []);
  const [cartItems, setCartItems] = useState([]); // { id, name, price, qty }
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [view, setView] = useState("CATEGORIES"); // CATEGORIES | DISHES

  // --- Tính toán tổng Cart ---
  const totalItemsInCart = cartItems.reduce((acc, item) => acc + item.qty, 0);

  // --- Logic Cập nhật Cart ---
  const handleUpdateCart = (dish, newQty) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== dish.id));
    } else {
      const existingItem = cartItems.find((item) => item.id === dish.id);
      if (existingItem) {
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === dish.id ? { ...item, qty: newQty } : item
          )
        );
      } else {
        setCartItems((prev) => [
          ...prev,
          {
            id: dish.id,
            name: dish.name,
            description: dish.description,
            price: dish.price,
            qty: newQty,
          },
        ]);
      }
    }
  };

  // Hàm mở/đóng Modal và xử lý xóa giỏ hàng sau khi đặt món
  const handleOpenCart = () => {
    setIsCartOpen(true);
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCategorySelect = (slug) => {
    // Lấy dishes theo category và chuyển view
    setDishes(mockDishesData[slug] || []);
    setView("DISHES");
  };

  const handleBack = () => {
    setView("CATEGORIES");
  };

  // ----------------------------------------------------
  // 🚨 VIEWS
  // ----------------------------------------------------

  const CategoryView = () => (
    <div className="p-4 float-start flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-white mb-6">Select a Category</h2>
      <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {mockCategories.map((cat) => (
          <CustomerCategoryCard
            key={cat.id}
            category={cat}
            onClick={handleCategorySelect}
          />
        ))}
      </div>
    </div>
  );

  const DishesView = () => (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 rounded-full bg-[#2D3748] text-white hover:bg-[#4A5568] flex justify-center"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-2xl font-bold text-white">
          {formatCategoryName(categorySlug)}
        </h2>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            cartItems={cartItems}
            onUpdateCart={handleUpdateCart}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#101922] font-['Work_Sans',_sans-serif]">
      {/* TOP HEADER (CART BUTTON) */}
      <div className="sticky top-0 z-40 bg-[#1A202C] p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-bold text-white">Restaurant Menu</h1>
        <button
          onClick={handleOpenCart}
          className="relative py-2 px-4 mr-4 rounded-xl text-white hover:bg-blue-600 transition-colors flex justify-center"
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          {totalItemsInCart > 0 && (
            <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {totalItemsInCart}
            </span>
          )}
        </button>
      </div>

      {/* CONTENT VIEWS */}
      {view === "CATEGORIES" ? <CategoryView /> : <DishesView />}

      {/* MODAL */}
      <CartModal
        isOpen={isCartOpen}
        onClose={(shouldClearCart) => {
          setIsCartOpen(false);
          if (shouldClearCart) {
            handleClearCart();
          }
        }}
        cartItems={cartItems}
        onClearCart={handleClearCart}
      />
    </div>
  );
};

export default OrderManagementInterface;
