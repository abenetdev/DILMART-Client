import {
  Laptop,
  Zap,
  Smartphone,
  Headphones,
  Watch,
  Gamepad2,
  Wifi,
  Tv,
  Camera,
} from "lucide-react";
export const registerFormControls = [
  {
    name: "userName",
    label: "User Name",
    placeholder: "Enter your user name",
    componentType: "input",
    type: "text",
  },
  {
    name: "email",
    label: "Email",
    placeholder: "Enter your email",
    componentType: "input",
    type: "email",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Enter your password",
    componentType: "input",
    type: "password",
  },
];

export const loginFormControls = [
  {
    name: "email",
    label: "Email",
    placeholder: "Enter your email",
    componentType: "input",
    type: "email",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Enter your password",
    componentType: "input",
    type: "password",
  },
];

export const categoryOptionsMap = {
"mobile-accessories": "Mobile & Accessories",
"computers-laptops": "Computers & Laptops",
"audio-entertainment": "Audio & Entertainment",
"smart-devices": "Smart Devices & Wearables",
gaming: "Gaming & Accessories",
networking: "Networking & Internet Devices",
"tv-entertainment": "TV & Home Entertainment",
"power-electrical": "Power & Electrical Accessories",
cameras: "Cameras & Photography",
printers: "Printers & Office Equipment",
storage: "Storage Devices",
components: "Computer Components",
accessories: "Electronic Accessories",
other: "Other Electronics",
};

export const brandOptionsMap = {
samsung: "Samsung",
apple: "Apple",
xiaomi: "Xiaomi",
tecno: "Tecno",
infinix: "Infinix",
hp: "HP",
dell: "Dell",
lenovo: "Lenovo",
asus: "ASUS",
acer: "Acer",
sony: "Sony",
jbl: "JBL",
canon: "Canon",
nikon: "Nikon",
logitech: "Logitech",
tp_link: "TP-Link",
huawei: "Huawei",
other: "Other",
};

export const addProductFormElements = [
{
label: "Product Name",
name: "name",
componentType: "input",
type: "text",
placeholder: "Enter product name",
},
{
label: "Description",
name: "description",
componentType: "textarea",
placeholder: "Enter product description",
},
{
label: "Category",
name: "category",
componentType: "select",
options: [
{ id: "mobile-accessories", label: "Mobile & Accessories" },
{ id: "computers-laptops", label: "Computers & Laptops" },
{ id: "audio-entertainment", label: "Audio & Entertainment" },
{ id: "smart-devices", label: "Smart Devices & Wearables" },
{ id: "gaming", label: "Gaming & Accessories" },
{ id: "networking", label: "Networking & Internet Devices" },
{ id: "tv-entertainment", label: "TV & Home Entertainment" },
{ id: "power-electrical", label: "Power & Electrical Accessories" },
{ id: "cameras", label: "Cameras & Photography" },
{ id: "printers", label: "Printers & Office Equipment" },
{ id: "storage", label: "Storage Devices" },
{ id: "components", label: "Computer Components" },
],
},
{
label: "Brand",
name: "brand",
componentType: "select",
options: [
{ id: "samsung", label: "Samsung" },
{ id: "apple", label: "Apple" },
{ id: "xiaomi", label: "Xiaomi" },
{ id: "tecno", label: "Tecno" },
{ id: "infinix", label: "Infinix" },
{ id: "hp", label: "HP" },
{ id: "dell", label: "Dell" },
{ id: "lenovo", label: "Lenovo" },
{ id: "asus", label: "ASUS" },
{ id: "acer", label: "Acer" },
{ id: "sony", label: "Sony" },
{ id: "jbl", label: "JBL" },
{ id: "canon", label: "Canon" },
{ id: "nikon", label: "Nikon" },
{ id: "logitech", label: "Logitech" },
{ id: "tp_link", label: "TP-Link" },
{ id: "other", label: "Other" },
],
},
{
label: "Price",
name: "price",
componentType: "input",
type: "number",
placeholder: "Enter product price",
},
{
label: "Sale Price",
name: "salePrice",
componentType: "input",
type: "number",
placeholder: "Enter sale price (optional)",
},
{
label: "Stock Quantity",
name: "stock",
componentType: "input",
type: "number",
placeholder: "Enter stock quantity",
},
{
label: "Status",
name: "status",
componentType: "select",
options: [
{ id: "active", label: "Active" },
{ id: "inactive", label: "Inactive" },
],
},
];

export const shoppingViewHeaderMenuItems = [
{
id: "home",
label: "Home",
path: "/",
},
{
id: "mobile-accessories",
label: "Mobile & Accessories",
path: "/listing",
},
{
id: "computers-laptops",
label: "Computers & Laptops",
path: "/listing",
},
{
id: "audio-entertainment",
label: "Audio",
path: "/listing",
},
{
id: "gaming",
label: "Gaming",
path: "/listing",
},
{
id: "smart-devices",
label: "Smart Devices",
path: "/listing",
}
];

export const filterOptions = {
category: [
{ id: "mobile-accessories", label: "Mobile & Accessories" },
{ id: "computers-laptops", label: "Computers & Laptops" },
{ id: "audio-entertainment", label: "Audio & Entertainment" },
{ id: "smart-devices", label: "Smart Devices & Wearables" },
{ id: "gaming", label: "Gaming & Accessories" },
{ id: "networking", label: "Networking & Internet Devices" },
{ id: "tv-entertainment", label: "TV & Home Entertainment" },
{ id: "power-electrical", label: "Power & Electrical Accessories" },
{ id: "cameras", label: "Cameras & Photography" },
{ id: "printers", label: "Printers & Office Equipment" },
{ id: "storage", label: "Storage Devices" },
{ id: "components", label: "Computer Components" },
],

brand: [
{ id: "samsung", label: "Samsung" },
{ id: "apple", label: "Apple" },
{ id: "xiaomi", label: "Xiaomi" },
{ id: "tecno", label: "Tecno" },
{ id: "infinix", label: "Infinix" },
{ id: "hp", label: "HP" },
{ id: "dell", label: "Dell" },
{ id: "lenovo", label: "Lenovo" },
{ id: "asus", label: "ASUS" },
{ id: "acer", label: "Acer" },
{ id: "sony", label: "Sony" },
{ id: "jbl", label: "JBL" },
{ id: "canon", label: "Canon" },
{ id: "nikon", label: "Nikon" },
{ id: "logitech", label: "Logitech" },
{ id: "tp_link", label: "TP-Link" },
],
};


export const CATEGORIES = [
  {
    id: "mobile-accessories",
    label: "Mobile & Accessories",
    icon: Smartphone,
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: "computers-laptops",
    label: "Computers & Laptops",
    icon: Laptop,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    id: "audio-entertainment",
    label: "Audio & Entertainment",
    icon: Headphones,
    color: "bg-purple-50 text-purple-600",
  },
  {
    id: "smart-devices",
    label: "Smart Devices",
    icon: Watch,
    color: "bg-pink-50 text-pink-600",
  },
  {
    id: "gaming",
    label: "Gaming",
    icon: Gamepad2,
    color: "bg-red-50 text-red-600",
  },
  {
    id: "networking",
    label: "Networking",
    icon: Wifi,
    color: "bg-green-50 text-green-600",
  },
  {
    id: "tv-entertainment",
    label: "TV & Entertainment",
    icon: Tv,
    color: "bg-yellow-50 text-yellow-600",
  },
  {
    id: "power-electrical",
    label: "Power & Electrical",
    icon: Zap,
    color: "bg-slate-50 text-slate-600",
  },
  {
    id: "cameras",
    label: "Cameras",
    icon: Camera,
    color: "bg-orange-50 text-orange-600",
  },
];


export const sortOptions = [
  { id: "price-lowtohigh", label: "Price: Low to High" },
  { id: "price-hightolow", label: "Price: High to Low" },
  { id: "title-atoz", label: "Title: A to Z" },
  { id: "title-ztoa", label: "Title: Z to A" },
];

export const addressFormControls = [
  {
    label: "Address",
    name: "address",
    componentType: "input",
    type: "text",
    placeholder: "Enter your address",
  },
  {
    label: "City",
    name: "city",
    componentType: "input",
    type: "text",
    placeholder: "Enter your city",
  },
  {
    label: "Pincode",
    name: "pincode",
    componentType: "input",
    type: "text",
    placeholder: "Enter your pincode",
  },
  {
    label: "Phone",
    name: "phone",
    componentType: "input",
    type: "text",
    placeholder: "Enter your phone number",
  },
  {
    label: "Notes (optional)",
    name: "notes",
    componentType: "textarea",
    placeholder: "Any special instructions for delivery (optional)",
  },
];
