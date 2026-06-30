import Razorpay from 'razorpay'

const isMock = process.env.RAZORPAY_KEY_ID === 'mock' || !process.env.RAZORPAY_KEY_ID

export const razorpay = isMock 
  ? null 
  : new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
