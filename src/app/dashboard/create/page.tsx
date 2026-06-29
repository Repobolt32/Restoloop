import { createRestaurant } from './actions'

export default function CreateRestaurantPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form action={createRestaurant} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Create Restaurant</h1>
        <input type="text" name="name" placeholder="Restaurant Name" required className="border p-2" />
        <input type="text" name="address" placeholder="Address" className="border p-2" />
        <input type="text" name="phone" placeholder="Phone" className="border p-2" />
        <input type="email" name="email" placeholder="Email" className="border p-2" />
        <input type="text" name="whatsappNumber" placeholder="WhatsApp Number (91xxxxxxxxxx)" required className="border p-2" />
        <input type="number" name="welcomeDiscountCents" placeholder="Welcome Discount (cents)" defaultValue={5000} required className="border p-2" />
        <input type="number" name="birthdayDiscountCents" placeholder="Birthday Discount (cents)" defaultValue={3800} required className="border p-2" />
        <input type="number" name="winbackDiscountCents" placeholder="Winback Discount (cents)" defaultValue={3000} required className="border p-2" />
        <button type="submit" className="bg-blue-500 text-white p-2">Create Restaurant</button>
      </form>
    </div>
  )
}
