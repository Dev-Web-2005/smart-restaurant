import React, { useState, useMemo } from 'react'

const CartPage = ({ cartItems, onClearCart, onUpdateCart, onClose }) => {
	const [step, setStep] = useState('CART')
	const [paymentLoading, setPaymentLoading] = useState(false)
	const [qrCodeUrl, setQrCodeUrl] = useState(null)
	const [isOrderPlaced, setIsOrderPlaced] = useState(false)
	const [paymentMethod, setPaymentMethod] = useState('QR') // 'QR' or 'CASH'

	// Calculate total (using totalPrice from cart items)
	const total = useMemo(
		() =>
			cartItems.reduce(
				(acc, item) => acc + (item.totalPrice || item.price * item.qty),
				0,
			),
		[cartItems],
	)

	// Close and reset state
	const handleClose = (shouldClearCart = false) => {
		setStep('CART')
		setQrCodeUrl(null)
		setIsOrderPlaced(false)
		setPaymentLoading(false)
		setPaymentMethod('QR')
		if (onClose) {
			onClose(shouldClearCart)
		}
	}

	// Call API to get QR Code or proceed with cash
	const handleCheckout = async () => {
		if (cartItems.length === 0) return

		// If cash payment, skip QR generation and go straight to confirmation
		if (paymentMethod === 'CASH') {
			setStep('CASH_CONFIRMATION')
			return
		}

		// QR payment flow
		setStep('PAYMENT')
		setPaymentLoading(true)

		console.log('Fetching QR code for payment...')

		// TODO: Replace with real API call
		// try {
		//     const qrRes = await axios.get(`/api/customer/payment/qr?amount=${total.toFixed(2)}`);
		//     setQrCodeUrl(qrRes.data.qrImageUrl);
		//     setStep('QR');
		// } catch (error) {
		//     alert("Failed to fetch QR code.");
		//     handleClose();
		// } finally {
		//     setPaymentLoading(false);
		// }

		// Simulation
		setTimeout(() => {
			setQrCodeUrl(
				'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_many_purposes.svg',
			)
			setStep('QR')
			setPaymentLoading(false)
		}, 1500)
	}

	// Call API to place order
	const handlePlaceOrder = async () => {
		setIsOrderPlaced(true)
		setPaymentLoading(true)

		// TODO: Replace with real API call
		// const orderPayload = {
		//   tableId: "T101",
		//   customerNotes: "Order paid via QR code.",
		//   paymentMethod: paymentMethod, // 'QR' or 'CASH'
		//   items: cartItems.map((item) => ({
		//     dishId: item.id,
		//     quantity: item.qty,
		//     name: item.name,
		//     price: item.price,
		//     notes: item.notes || "",
		//   })),
		// };
		// try {
		//     await axios.post('/api/customer/order/place', orderPayload);
		// } catch (error) {
		//     alert('Failed to place order.');
		// } finally {
		//     setPaymentLoading(false);
		//     onClearCart();
		//     handleClose();
		// }

		// Simulation
		setTimeout(() => {
			const paymentMsg = paymentMethod === 'CASH' ? 'Cash payment' : 'QR payment'
			alert(`Order placed successfully! (${paymentMsg})`)
			setPaymentLoading(false)
			onClearCart()
			handleClose()
		}, 2000)
	}

	return (
		<div className="p-2 sm:p-4 max-w-2xl mx-auto pb-24">
			<div className="mb-4 sm:mb-6">
				<h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
					{step === 'CART' ? 'Your Cart' : 'Order Confirmation'}
				</h2>
				<p className="text-[#9dabb9] text-sm">
					{step === 'CART'
						? 'Review your order before checkout'
						: 'Complete your payment'}
				</p>
			</div>

			{/* CART VIEW */}
			{step === 'CART' && (
				<>
					{/* Payment Method Selection */}
					<div className="mb-6 backdrop-blur-xl bg-[#1A202C]/80 rounded-xl border border-white/20 p-4">
						<p className="text-white font-bold text-sm mb-3">Payment Method</p>
						<div className="grid grid-cols-2 gap-3">
							<button
								onClick={() => setPaymentMethod('QR')}
								className={`relative p-4 rounded-lg border-2 transition-all ${
									paymentMethod === 'QR'
										? 'border-[#137fec] bg-[#137fec]/20'
										: 'border-white/20 bg-[#2D3748]/50 hover:border-white/40'
								}`}
							>
								<div className="flex flex-col items-center gap-2">
									<span className="material-symbols-outlined text-3xl text-white">
										qr_code
									</span>
									<span className="text-white font-semibold text-sm">QR Payment</span>
									<span className="text-[#9dabb9] text-xs">Scan to pay</span>
								</div>
								{paymentMethod === 'QR' && (
									<div className="absolute top-2 right-2">
										<span className="material-symbols-outlined text-[#137fec] text-xl fill-1">
											check_circle
										</span>
									</div>
								)}
							</button>

							<button
								onClick={() => setPaymentMethod('CASH')}
								className={`relative p-4 rounded-lg border-2 transition-all ${
									paymentMethod === 'CASH'
										? 'border-[#4ade80] bg-[#4ade80]/20'
										: 'border-white/20 bg-[#2D3748]/50 hover:border-white/40'
								}`}
							>
								<div className="flex flex-col items-center gap-2">
									<span className="material-symbols-outlined text-3xl text-white">
										payments
									</span>
									<span className="text-white font-semibold text-sm">Cash</span>
									<span className="text-[#9dabb9] text-xs">Pay at counter</span>
								</div>
								{paymentMethod === 'CASH' && (
									<div className="absolute top-2 right-2">
										<span className="material-symbols-outlined text-[#4ade80] text-xl fill-1">
											check_circle
										</span>
									</div>
								)}
							</button>
						</div>
					</div>

					<div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
						{cartItems.length === 0 ? (
							<div className="text-center py-12 sm:py-20 backdrop-blur-xl bg-[#1A202C]/80 rounded-xl border border-white/20">
								<span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4 block">
									shopping_cart
								</span>
								<p className="text-[#9dabb9] text-lg">Your cart is empty</p>
							</div>
						) : (
							cartItems.map((item, index) => (
								<div
									key={index}
									className="backdrop-blur-xl bg-[#1A202C]/80 p-3 sm:p-5 rounded-xl border border-white/20"
								>
									<div className="flex items-start gap-4">
										{/* Dish Image */}
										{item.imageUrl && (
											<img
												src={item.imageUrl}
												alt={item.name}
												className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
											/>
										)}

										{/* Dish Info */}
										<div className="flex-1">
											<div className="flex justify-between items-start mb-2">
												<div>
													<p className="text-white font-bold text-lg">{item.name}</p>
													{item.description && (
														<p className="text-[#9dabb9] text-xs mt-1 line-clamp-2">
															{item.description}
														</p>
													)}
												</div>
												<button
													onClick={() => {
														const newCart = cartItems.filter((_, i) => i !== index)
														onUpdateCart?.(newCart)
													}}
													className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
												>
													<span className="material-symbols-outlined text-base">
														delete
													</span>
												</button>
											</div>

											{/* Modifiers */}
											{item.modifiers && item.modifiers.length > 0 && (
												<div className="space-y-1 mb-3 bg-[#2D3748] p-2 rounded-lg">
													{item.modifiers.map((mod, modIndex) => (
														<div key={modIndex} className="text-xs text-[#9dabb9]">
															<span className="font-semibold text-white">
																{mod.groupName}:
															</span>{' '}
															<span>
																{mod.label}
																{mod.priceDelta !== 0 && (
																	<span className="text-green-400 font-medium">
																		{' '}
																		({mod.priceDelta > 0 ? '+' : ''}$
																		{mod.priceDelta.toFixed(2)})
																	</span>
																)}
															</span>
														</div>
													))}
												</div>
											)}

											{/* Special Notes */}
											{item.specialNotes && (
												<div className="mb-3 text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-lg">
													<span className="font-semibold">Note:</span> {item.specialNotes}
												</div>
											)}

											{/* Quantity Controls and Price */}
											<div className="flex justify-between items-center">
												<div className="flex items-center gap-3 bg-[#2D3748] rounded-lg p-1">
													<button
														onClick={() => {
															if (item.qty > 1) {
																const newQty = item.qty - 1
																const modifierTotal =
																	item.modifiers?.reduce(
																		(sum, mod) => sum + (mod.priceDelta || 0),
																		0,
																	) || 0
																const newTotalPrice =
																	(item.price + modifierTotal) * newQty
																const newCart = [...cartItems]
																newCart[index] = {
																	...item,
																	qty: newQty,
																	totalPrice: newTotalPrice,
																}
																onUpdateCart?.(newCart)
															}
														}}
														className="w-8 h-8 flex items-center justify-center bg-[#1A202C] text-white rounded hover:bg-[#4A5568] transition-colors"
													>
														−
													</button>
													<span className="text-white font-bold w-10 text-center text-lg">
														{item.qty}
													</span>
													<button
														onClick={() => {
															const newQty = item.qty + 1
															const modifierTotal =
																item.modifiers?.reduce(
																	(sum, mod) => sum + (mod.priceDelta || 0),
																	0,
																) || 0
															const newTotalPrice = (item.price + modifierTotal) * newQty
															const newCart = [...cartItems]
															newCart[index] = {
																...item,
																qty: newQty,
																totalPrice: newTotalPrice,
															}
															onUpdateCart?.(newCart)
														}}
														className="w-8 h-8 flex items-center justify-center bg-[#137fec] text-white rounded hover:bg-blue-600 transition-colors"
													>
														+
													</button>
												</div>
												<span className="text-[#4ade80] font-bold text-xl">
													${(item.totalPrice || item.price * item.qty).toFixed(2)}
												</span>
											</div>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</>
			)}

			{/* PAYMENT/QR VIEW */}
			{(step === 'PAYMENT' || step === 'QR') && (
				<div className="backdrop-blur-xl bg-[#1A202C]/80 rounded-xl border border-white/20 p-10">
					<div className="flex flex-col items-center justify-center space-y-6">
						{paymentLoading && (
							<>
								<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#137fec]"></div>
								<p className="text-white text-lg">Generating QR Code...</p>
							</>
						)}
						{qrCodeUrl && !paymentLoading && (
							<>
								<div className="bg-white p-6 rounded-2xl">
									<img src={qrCodeUrl} alt="Payment QR Code" className="w-64 h-64" />
								</div>
								<div className="text-center">
									<p className="text-xl font-bold text-white mb-2">
										Scan to Complete Payment
									</p>
									<p className="text-[#9dabb9] text-sm">
										Use your mobile banking app to scan this QR code
									</p>
								</div>
							</>
						)}
					</div>
				</div>
			)}

			{/* CASH CONFIRMATION VIEW */}
			{step === 'CASH_CONFIRMATION' && (
				<div className="backdrop-blur-xl bg-[#1A202C]/80 rounded-xl border border-white/20 p-10">
					<div className="flex flex-col items-center justify-center space-y-6">
						<div className="bg-[#4ade80]/20 p-8 rounded-full">
							<span className="material-symbols-outlined text-[#4ade80] text-6xl">
								payments
							</span>
						</div>
						<div className="text-center">
							<p className="text-xl font-bold text-white mb-2">Cash Payment</p>
							<p className="text-[#9dabb9] text-sm mb-4">
								Please pay at the counter when your order is ready
							</p>
							<div className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-lg p-4 mt-4">
								<p className="text-2xl font-black text-[#4ade80]">
									Total: ${total.toFixed(2)}
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Footer - Total and Actions */}
			<div className="mt-4 sm:mt-6 backdrop-blur-xl bg-[#1A202C]/80 rounded-xl border border-white/20 p-4 sm:p-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
					<div>
						<p className="text-[#9dabb9] text-xs sm:text-sm mb-1">Total Amount</p>
						<p className="text-2xl sm:text-4xl font-black text-[#4ade80]">
							${total.toFixed(2)}
						</p>
					</div>

					<div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
						{step === 'CART' && (
							<>
								{cartItems.length > 0 && (
									<button
										onClick={() => {
											if (window.confirm('Are you sure you want to clear your cart?')) {
												onClearCart()
											}
										}}
										className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg bg-red-500/20 text-red-400 text-sm sm:text-base font-bold hover:bg-red-500/30 transition-colors"
									>
										Clear
									</button>
								)}
								<button
									onClick={handleCheckout}
									disabled={cartItems.length === 0}
									className="flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-lg bg-[#137fec] text-white text-sm sm:text-base font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Checkout
								</button>
							</>
						)}

						{step === 'QR' && (
							<button
								onClick={handlePlaceOrder}
								disabled={isOrderPlaced || paymentLoading}
								className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg bg-[#4ade80] text-black text-sm sm:text-base font-bold hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{isOrderPlaced ? (
									<>
										<span className="material-symbols-outlined">check_circle</span>
										Order Placed
									</>
								) : (
									<>
										<span className="material-symbols-outlined">shopping_bag</span>
										Confirm & Place Order
									</>
								)}
							</button>
						)}

						{step === 'CASH_CONFIRMATION' && (
							<button
								onClick={handlePlaceOrder}
								disabled={isOrderPlaced || paymentLoading}
								className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg bg-[#4ade80] text-black text-sm sm:text-base font-bold hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{isOrderPlaced ? (
									<>
										<span className="material-symbols-outlined">check_circle</span>
										Order Placed
									</>
								) : (
									<>
										<span className="material-symbols-outlined">shopping_bag</span>
										Place Order
									</>
								)}
							</button>
						)}
					</div>
				</div>

				{step === 'CART' && cartItems.length > 0 && (
					<div className="pt-4 border-t border-white/10 text-center">
						<p className="text-[#9dabb9] text-xs">
							Items: {cartItems.reduce((acc, item) => acc + item.qty, 0)}
						</p>
					</div>
				)}
			</div>
		</div>
	)
}

export default CartPage
