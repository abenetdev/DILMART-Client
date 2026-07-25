import { MapPin, Phone, Hash, FileText, Pencil, Trash2, CheckCircle2 } from "lucide-react";

function AddressCard({
  addressInfo,
  handleDeleteAddress,
  handleEditAddress,
  setCurrentSelectedAddress,
  selectedId,
}) {
  const isSelected = selectedId?._id === addressInfo?._id;

  return (
    <div
      onClick={() => setCurrentSelectedAddress?.(addressInfo)}
      className={`
        relative rounded-2xl border-2 p-4 transition-all duration-200
        ${setCurrentSelectedAddress ? "cursor-pointer" : ""}
        ${isSelected
          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        }
      `}
    >
      {/* Selected check */}
      {isSelected && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="h-5 w-5 text-primary fill-primary/10" />
        </div>
      )}

      {/* Address details */}
      <div className="space-y-2 pr-6">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{addressInfo?.address}</p>
            <p className="text-sm text-muted-foreground">{addressInfo?.city}{addressInfo?.pincode ? `, ${addressInfo.pincode}` : ""}</p>
          </div>
        </div>

        {addressInfo?.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">{addressInfo.phone}</p>
          </div>
        )}

        {addressInfo?.notes && (
          <div className="flex items-start gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground italic">{addressInfo.notes}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={(e) => { e.stopPropagation(); handleEditAddress(addressInfo); }}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg py-1.5 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
        <div className="w-px bg-gray-100" />
        <button
          onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addressInfo); }}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg py-1.5 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}

export default AddressCard;
