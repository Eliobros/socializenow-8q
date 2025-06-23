'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function PagamentoSelo() {
  const [numero, setNumero] = useState('')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [metodoPagamento, setMetodoPagamento] = useState('Mpesa') // default Mpesa
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const pagar = async () => {
    if (!numero || !nome) return alert('Preencha todos os campos obrigatórios')

    setLoading(true)

    try {
      const res = await axios.post('https://mozpayment.co.mz/api/1.1/wf/white-checkout', {
        carteira: process.env.NEXT_PUBLIC_CARTEIRA_ID,
        numero,
        nome,
        valor: '10', // Valor para teste: 10 meticais
        meio_de_pagamento: metodoPagamento, // usa o que foi selecionado no select
        email,
        return_url: 'https://socializenow.com/verifica'
      })

      console.log('Dados do pagamento:', res.data)

      const url = res.data?.url || res.data // considerando que pode retornar só a url em string

      if (!url) {
        alert('Erro: URL de checkout não recebida.')
        setLoading(false)
        return
      }

      window.location.href = url

    } catch (err) {
      console.error(err)
      alert('Erro ao iniciar pagamento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Pagar 10MT pelo Selo de Verificação</h1>

      <input
        type="text"
        placeholder="Número Mpesa/Emola"
        className="border p-2 mb-2 w-full"
        value={numero}
        onChange={(e) => setNumero(e.target.value)}
      />

      <input
        type="text"
        placeholder="Seu nome"
        className="border p-2 mb-2 w-full"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <input
        type="email"
        placeholder="Seu email (opcional)"
        className="border p-2 mb-4 w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="block mb-2 font-semibold">Método de pagamento:</label>
      <select
        value={metodoPagamento}
        onChange={(e) => setMetodoPagamento(e.target.value)}
        className="border p-2 mb-4 w-full"
      >
        <option value="Mpesa">Mpesa</option>
        <option value="Emola">Emola</option>
      </select>

      <button
        onClick={pagar}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? 'Processando...' : 'Pagar 10MT'}
      </button>
    </div>
  )
}
