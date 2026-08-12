import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Package, Loader2 } from "lucide-react";
import {
  getAllOrdersByUserId,
  getOrderDetails,
  resetOrderDetails,
} from "@/store/shop/order-slice";
import { fetchMyReturnRequests } from "@/store/shop/return-slice";
import ShoppingOrderDetailsView from "../order-details";
import Pagination from "@/components/common/pagination";
import { currencyFormatter } from "@/utils";

const PAGE_SIZE = 5;

const statusColor = (status) => {
  const map = {
    delivered:  "bg-green-100 text-green-800",
    shipped:    "bg-purple-100 text-purple-800",
    processing: "bg-blue-100 text-blue-800",
    confirmed:  "bg-indigo-100 text-indigo-800",
    cancelled:  "bg-red-100 text-red-800",
    pending:    "bg-yellow-100 text-yellow-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
};

function AccountOrders() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { orderList, orderDetails, isLoading } = useSelector(
    (state) => state.shopOrder
  );
  const [openDetails, setOpenDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (userId) {
      dispatch(getAllOrdersByUserId(userId));
      dispatch(fetchMyReturnRequests());
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (orderDetails) setOpenDetails(true);
  }, [orderDetails]);

  // Reset to page 1 when order list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [orderList?.length]);

  const handleView = (id) => dispatch(getOrderDetails(id));

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalOrders = orderList?.length ?? 0;
  const totalPages  = Math.ceil(totalOrders / PAGE_SIZE);
  const startIdx    = (currentPage - 1) * PAGE_SIZE;
  const paginated   = orderList?.slice(startIdx, startIdx + PAGE_SIZE) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage all your orders
        </p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order History
            </span>
            {totalOrders > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {totalOrders} order{totalOrders !== 1 ? "s" : ""}
                {totalPages > 1 && ` · page ${currentPage} of ${totalPages}`}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : paginated.length > 0 ? (
            <>
              <div className="space-y-3">
                {paginated.map((order) => (
                  <div
                    key={order._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold font-mono">
                          ORD-{order._id?.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.orderDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month:   "long",
                            day:     "numeric",
                            year:    "numeric",
                          })}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className={statusColor(order.orderStatus)}>
                            {order.orderStatus}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {order.paymentStatus}
                          </Badge>
                          {order.paymentStatus === "paid" &&
                            order.orderStatus === "shipped" &&
                            !order.deliveryConfirmedByCustomer && (
                              <a onClick={() => handleView(order._id)}>
                                <Badge className="bg-orange-100 cursor-pointer text-orange-800 hover:bg-orange-100">
                                  Confirm delivery
                                </Badge>
                              </a>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <span className="text-lg font-bold">{currencyFormatter(order.totalAmount)}</span>
                      <Button size="sm" variant="outline" onClick={() => handleView(order._id)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="text-center py-16">
              <Package className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={openDetails}
        onOpenChange={() => {
          setOpenDetails(false);
          dispatch(resetOrderDetails());
        }}
      >
        <ShoppingOrderDetailsView orderDetails={orderDetails} />
      </Dialog>
    </div>
  );
}

export default AccountOrders;
