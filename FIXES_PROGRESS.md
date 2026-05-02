# Fix Progress

## DONE (17/19)

1.  ✅ Stock off-by-one — `CreateOrderAction`: `<= quantity` → `< quantity`
2.  ✅ Backend search — `search` scope added to `Product`, wired into `ProductController` + `ProductFilterRequest`
3.  ✅ Tax mismatch — backend now computes 10% tax in both `CreateOrderAction` & `CreateOrderFromProductAction`; frontend cart shows "Estimated Total"
4.  ✅ Idempotency key reused on retry — `useMemo` replaced with a fresh `generateIdempotencyKey()` call per attempt in `Cart.jsx`
5.  ✅ N+1 Stripe calls — `reconcileOrderStatus` removed from the list endpoint; only called on single-order `show`
6.  ✅ Orders page unconditional polling — `refetchInterval` now returns `false` unless a pending/processing order exists
7.  ✅ `CartController::destroy` returns updated cart items — badge stays accurate without extra request
8.  ✅ 401 interceptor — now dispatches `auth:logout` custom event; `useAutoLogout()` hook in `useAuth.js` handles it via React Router (no hard reload)
9.  ✅ `client_secret` stripped from DB — `ProcessPaymentAction` returns `[Order, clientSecret]` tuple; secret is never persisted; frontend stores it in `sessionStorage` keyed by order ID and clears it on success
10. ✅ `authorize()` added to `AddToCartRequest`, `BuyNowRequest`, `UpdateCartItemRequest`
11. ✅ Token stored in two places — unified to Zustand only; `client.js` reads `useAuthStore.getState().token`; manual `localStorage.setItem('auth_token')` removed from `authStore.js`
12. ✅ Dead `OrderCheckout.jsx` deleted
13. ✅ `GET /auth/user` endpoint added (`UserController@show`) + `/profile` frontend page
14. ✅ `PUT /auth/user` endpoint added (`UserController@update`, `UpdateProfileRequest`) + profile form UI
15. ✅ Order cancellation — `POST /v1/orders/{id}/cancel` endpoint + stock restore + "Cancel Order" button on `OrderDetail.jsx`
16. ✅ Cursor pagination load-more — `Orders.jsx` now has a working "Load more orders" button; `allOrders` state accumulates pages
17. ✅ Error boundary — `ErrorBoundary.jsx` created; wraps `<Header>` + `<AnimatedRoutes>` in `App.jsx`
18. ✅  Per-page `<title>` / meta tags (SEO)
    - `usePageTitle` hook created at `src/hooks/usePageTitle.js`
    - Applied to: `Home.jsx` ✅, `Products.jsx` ✅
    - Still needs: `ProductDetail`, `Cart`, `Orders`, `OrderDetail`, `OrderSuccess`, `Login`, `Register`, `ForgotPassword`, `ResetPassword`, `Profile`, `NotFound`

19. ✅  Home hero CTA — "Create Account" / "Get Started" button should be hidden for logged-in users
