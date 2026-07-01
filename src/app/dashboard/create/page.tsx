import { createRestaurant } from './actions'

export default function CreateRestaurantPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action={createRestaurant} className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">Create Your Restaurant</h1>
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Restaurant Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="whatsappNumber" className="block text-sm font-medium">WhatsApp Number</label>
          <input
            id="whatsappNumber"
            name="whatsappNumber"
            type="text"
            required
            placeholder="919876543210"
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="welcomeDiscount" className="block text-sm font-medium">Welcome Discount (%)</label>
          <input
            id="welcomeDiscount"
            name="welcomeDiscount"
            type="number"
            required
            min="1"
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="birthdayDiscount" className="block text-sm font-medium">Birthday Discount (%)</label>
          <input
            id="birthdayDiscount"
            name="birthdayDiscount"
            type="number"
            required
            min="1"
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="winbackDiscount" className="block text-sm font-medium">Winback Discount (%)</label>
          <input
            id="winbackDiscount"
            name="winbackDiscount"
            type="number"
            required
            min="1"
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          Create Restaurant
        </button>
      </form>
    </div>
  )
}
