import { createRestaurant } from './actions'

export default async function CreateRestaurantPage(props: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await props.searchParams
  return (
    <div className="min-h-screen bg-[--color-background] flex items-center justify-center p-4">
      <form action={createRestaurant} className="bg-white border border-[--color-border] rounded-2xl p-8 shadow-md w-full max-w-md flex flex-col gap-6">
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-xs font-bold">
            {error.replace(/\(|\)/g, '')}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[--color-foreground] font-display uppercase mb-1">
            Create Your Restaurant
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent]">
            Retain guests on autopilot
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">Restaurant Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="border border-[--color-border] rounded-lg px-4 py-3 text-sm focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 w-full font-bold text-[--color-foreground]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="whatsappNumber" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">WhatsApp Number</label>
          <input
            id="whatsappNumber"
            name="whatsappNumber"
            type="text"
            required
            placeholder="919876543210"
            className="border border-[--color-border] rounded-lg px-4 py-3 text-sm focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 w-full font-mono font-bold text-[--color-foreground]"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="welcomeDiscount" className="text-[9px] font-black uppercase tracking-wider text-[--color-grey-600] line-clamp-1">Welcome (%)</label>
            <input
              id="welcomeDiscount"
              name="welcomeDiscount"
              type="number"
              required
              min="1"
              className="border border-[--color-border] rounded-lg px-3 py-3 text-sm focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 w-full font-bold text-[--color-foreground]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="birthdayDiscount" className="text-[9px] font-black uppercase tracking-wider text-[--color-grey-600] line-clamp-1">Birthday (%)</label>
            <input
              id="birthdayDiscount"
              name="birthdayDiscount"
              type="number"
              required
              min="1"
              className="border border-[--color-border] rounded-lg px-3 py-3 text-sm focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 w-full font-bold text-[--color-foreground]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="winbackDiscount" className="text-[9px] font-black uppercase tracking-wider text-[--color-grey-600] line-clamp-1">Winback (%)</label>
            <input
              id="winbackDiscount"
              name="winbackDiscount"
              type="number"
              required
              min="1"
              className="border border-[--color-border] rounded-lg px-3 py-3 text-sm focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 w-full font-bold text-[--color-foreground]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-black hover:bg-gray-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest py-3.5 w-full transition-colors cursor-pointer"
        >
          Create Restaurant
        </button>
      </form>
    </div>
  )
}
