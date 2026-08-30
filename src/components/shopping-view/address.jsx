import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addNewAddress, deleteAddress, editaAddress, fetchAllAddresses,
} from "@/store/shop/address-slice";
import AddressCard from "./address-card";
import { useToast } from "../ui/use-toast";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Plus, X, MapPin, Loader2 } from "lucide-react";

const EMPTY = { address: "", city: "", phone: "", pincode: "", notes: "" };

function AddressForm({ formData, setFormData, onSubmit, onCancel, isEditing, isSubmitting }) {
  const set = (f, v) => setFormData((p) => ({ ...p, [f]: v }));

  const isValid =
    formData.address.trim() &&
    formData.city.trim() &&
    formData.phone.trim() &&
    formData.pincode.trim();

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="addr-address">Street Address <span className="text-red-500">*</span></Label>
        <Input
          id="addr-address"
          placeholder="123 Main St, Apt 4B"
          value={formData.address}
          onChange={(e) => set("address", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="addr-city">City <span className="text-red-500">*</span></Label>
          <Input
            id="addr-city"
            placeholder="Addis Ababa"
            value={formData.city}
            onChange={(e) => set("city", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr-pincode">Postal Code <span className="text-red-500">*</span></Label>
          <Input
            id="addr-pincode"
            placeholder="1000"
            value={formData.pincode}
            onChange={(e) => set("pincode", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="addr-phone">Phone Number <span className="text-red-500">*</span></Label>
        <Input
          id="addr-phone"
          type="tel"
          placeholder="+251 91 234 5678"
          value={formData.phone}
          onChange={(e) => set("phone", e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="addr-notes">
          Delivery Notes{" "}
          <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="addr-notes"
          placeholder="Any special delivery instructions..."
          value={formData.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1 gap-2" disabled={!isValid || isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Add Address"}
        </Button>
      </div>
    </form>
  );
}

export default function Address({ setCurrentSelectedAddress, selectedId }) {
  const [formData,        setFormData]        = useState(EMPTY);
  const [currentEditedId, setCurrentEditedId] = useState(null);
  const [formOpen,        setFormOpen]        = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  const dispatch = useDispatch();
  const { user }  = useSelector((s) => s.auth);
  const { addressList } = useSelector((s) => s.shopAddress);
  const { toast } = useToast();

  // Fetch on mount and inspect the RESULT directly.
  // Never rely on Redux isLoading or addressList for the initial open decision
  // because addressLoading starts as false and addressList starts as [] —
  // any effect watching those will fire immediately with empty data before
  // the network response arrives.
  useEffect(() => {
    dispatch(fetchAllAddresses(user?.id)).then((action) => {
      const list = action?.payload?.data ?? [];

      if (list.length === 0) {
        // Confirmed empty from server — open the add form
        if (setCurrentSelectedAddress) setCurrentSelectedAddress(null);
        setFormOpen(true);
      } else if (list.length === 1 && setCurrentSelectedAddress) {
        // Auto-select the only address
        setCurrentSelectedAddress(list[0]);
      }
      // 2+ addresses: leave selection untouched
    });
  }, [dispatch, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function openAddForm() {
    setCurrentEditedId(null);
    setFormData(EMPTY);
    setFormOpen(true);
  }

  function handleEditAddress(addr) {
    setCurrentEditedId(addr._id);
    setFormData({
      address:  addr.address  || "",
      city:     addr.city     || "",
      phone:    addr.phone    || "",
      pincode:  addr.pincode  || "",
      notes:    addr.notes    || "",
    });
    setFormOpen(true);
    setTimeout(() => {
      document.getElementById("address-form-section")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  }

  function closeForm() {
    setFormOpen(false);
    setCurrentEditedId(null);
    setFormData(EMPTY);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (addressList.length >= 3 && !currentEditedId) {
      toast({ title: "Maximum 3 addresses allowed", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    if (currentEditedId) {
      const result = await dispatch(
        editaAddress({ userId: user?.id, addressId: currentEditedId, formData })
      );
      if (result?.payload?.success) {
        dispatch(fetchAllAddresses(user?.id));
        toast({ title: "Address updated" });
        if (setCurrentSelectedAddress && selectedId?._id === currentEditedId) {
          setCurrentSelectedAddress({ ...selectedId, ...formData });
        }
        closeForm();
      }
    } else {
      const result = await dispatch(addNewAddress({ ...formData, userId: user?.id }));
      if (result?.payload?.success) {
        await dispatch(fetchAllAddresses(user?.id));
        const newAddr = result?.payload?.data;
        if (newAddr && setCurrentSelectedAddress) {
          setCurrentSelectedAddress(newAddr);
        }
        toast({ title: "Address added" });
        closeForm();
      }
    }

    setIsSubmitting(false);
  }

  async function handleDeleteAddress(addr) {
    const result = await dispatch(
      deleteAddress({ userId: user?.id, addressId: addr._id })
    );
    if (result?.payload?.success) {
      dispatch(fetchAllAddresses(user?.id));
      toast({ title: "Address removed" });
      if (selectedId?._id === addr._id) setCurrentSelectedAddress?.(null);
    }
  }

  const canAddMore = addressList.length < 3;

  return (
    <div className="space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Delivery Address
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {addressList.length === 0
              ? "Add an address to continue"
              : addressList.length >= 2
              ? `${addressList.length} saved addresses - select one`
              : ""}
          </p>
        </div>

        {canAddMore && !formOpen && (
          <button
            onClick={openAddForm}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add new
          </button>
        )}
      </div>

      {/* Address cards */}
      {addressList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addressList.map((addr) => (
            <AddressCard
              key={addr._id}
              addressInfo={addr}
              selectedId={selectedId}
              setCurrentSelectedAddress={setCurrentSelectedAddress}
              handleEditAddress={handleEditAddress}
              handleDeleteAddress={handleDeleteAddress}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {addressList.length === 0 && !formOpen && (
        <div
          onClick={openAddForm}
          className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
        >
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">No addresses saved</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click to add your first delivery address
            </p>
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      {formOpen && (
        <div
          id="address-form-section"
          className="rounded-2xl border bg-gray-50/50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
            <p className="text-sm font-semibold text-gray-900">
              {currentEditedId ? "Edit Address" : "New Address"}
            </p>
            <button
              onClick={closeForm}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            <AddressForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              isEditing={!!currentEditedId}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Max reached notice */}
      {addressList.length >= 3 && !formOpen && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum 3 addresses - delete one to add a new address.
        </p>
      )}
    </div>
  );
}
