import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Payment } from '@/models/payment'

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const data = await req.json()

    const pagamento = await Payment.create(data)

    return NextResponse.json({ success: true, pagamento })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Erro ao gravar pagamento' }, { status: 500 })
  }
}
