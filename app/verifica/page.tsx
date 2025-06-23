'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'

export default function Verifica() {
  const params = useSearchParams()

  useEffect(() => {
    const salvarPagamento = async () => {
      const numero = params.get('numero')
      const nome = params.get('nome')
      const email = params.get('email')
      const valor = params.get('valor')
      const meio_de_pagamento = params.get('meio_de_pagamento')

      if (!numero || !nome || !valor) return

      try {
        await axios.post('/api/pagamento', {
          numero,
          nome,
          email,
          valor,
          meio_de_pagamento,
          status: 'sucesso'
        })
        console.log('Pagamento salvo com sucesso!')
      } catch (err) {
        console.error('Erro ao salvar pagamento:', err)
      }
    }

    salvarPagamento()
  }, [params])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Pagamento concluído com sucesso!</h1>
      <p>Obrigado por apoiar a SocializeNow 🚀</p>
    </div>
  )
}
