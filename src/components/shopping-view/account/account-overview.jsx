import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package, Heart, ShoppingCart, ArrowRight,
  TrendingUp, Clock, Store, ChevronRight,
} from "lucide-react";
import { getAllOrdersByUserId } from "@/store/shop/order-slice";
import { fetchCartItems } from "@/store/shop/cart-slice";
import { fetchWishlist } from "@/store/shop/wishlist-slice";
import { getSellerStatus } from "@/store/shop/seller-slice";
import { currencyFormatter } from "@/utils";


const statusColor = (status) => {
  const map = {
    delivered: "bg-green-100 text-green-800",
    shipped: "bg-purple-100 text-purple-800",
    processing: "bg-blue-100 text-blue-800",
    confirmed: "bg-indigo-100 text-indigo-800",
    cancelled: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
};

function AccountOverview() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((state) => state.auth);
  const { orderList }            = useSelector((state) => state.shopOrder);
  const { cartItems }            = useSelector((state) => state.shopCart);
  const { count: wishlistCount } = useSelector((state) => state.shopWishlist);
  const { sellerStatus }         = useSelector((state) => state.shopSeller);

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (userId) {
      dispatch(getAllOrdersByUserId(userId));
      dispatch(fetchCartItems(userId));
      dispatch(fetchWishlist(userId));
      dispatch(getSellerStatus());
    }
  }, [dispatch, userId]);

  const cartCount = cartItems?.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
  const totalSpent = orderList
    ?.filter((o) => o.paymentStatus === "paid")
    .reduce((s, o) => s + (o.totalAmount || 0), 0) || 0;
  const recentOrders = [...(orderList || [])].slice(0, 4);

  const stats = [
    {
      label: "Total Orders",
      value: orderList?.length || 0,
      icon: Package,
      color: "from-blue-500 to-blue-600",
      link: "/account/orders",
    },
    {
      label: "Wishlist Items",
      value: wishlistCount,
      icon: Heart,
      color: "from-rose-500 to-pink-600",
      link: "/account/wishlist",
    },
    {
      label: "Cart Items",
      value: cartCount,
      icon: ShoppingCart,
      color: "from-violet-500 to-purple-600",
      link: "/account/cart",
    },
    {
      label: "Total Spent",
      value: currencyFormatter(totalSpent),
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600",
      link: "/account/orders",
      isText: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back, {user?.userName?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your account today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, link, isText }) => (
          <Link key={label} to={link}>
            <Card className="group overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${color} p-4 text-white`}>
                  <Icon className="h-6 w-6 opacity-90" />
                </div>
                <div className="p-4 flex items-end justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className={`font-bold mt-1 ${isText ? "text-lg" : "text-2xl"}`}>
                      {value}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Orders
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your latest purchases
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/account/orders">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium font-mono text-sm">
                        ORD-{order._id?.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.orderDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={statusColor(order.orderStatus)}>
                      {order.orderStatus}
                    </Badge>
                    <span className="font-semibold">{currencyFormatter(order.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No orders yet</p>
              <Button className="mt-4" asChild>
                <Link to="/listing">Start Shopping</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {/* ── Become a Seller Banner ────────────────────────── */}
      {user?.role === "user" && !sellerStatus && (
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-xl flex-shrink-0">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-lg">Start Selling on MarketPlace</p>
              <p className="text-slate-300 text-sm mt-0.5">
                Turn your passion into profit. Open your own store and reach thousands of customers.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/become-seller")}
            className="shrink-0 bg-white text-slate-900 hover:bg-slate-100 gap-2"
          >
            Become a Seller
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {user?.role === "user" && sellerStatus === "pending" && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 flex items-center gap-3 text-sm text-yellow-800">
          <Clock className="h-5 w-5 flex-shrink-0 text-yellow-600" />
          <span>
            Your seller application is <strong>under review</strong>. We'll notify you once it's processed.
          </span>
        </div>
      )}

      {user?.role === "user" && sellerStatus === "rejected" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-3 text-sm text-red-800">
          <span>Your previous seller application was not approved.</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/become-seller")}
            className="shrink-0 border-red-300 text-red-700 hover:bg-red-100"
          >
            Reapply
          </Button>
        </div>
      )}
    </div>
  );
}

export default AccountOverview;
