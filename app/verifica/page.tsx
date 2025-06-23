// app/verifica/page.tsx (server component)
import React, { Suspense } from 'react'

const VerificaClient = React.lazy(() => import('./verificaClient'))

export default function Page() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <VerificaClient />
    </Suspense>
  )
}
