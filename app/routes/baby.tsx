import { Outlet } from '@remix-run/react'
import { LoaderArgs } from '@remix-run/server-runtime'

export default function BabyLayout() {
  return (
    <main className="py-2 md:py-5 px-2 flex flex-col h-screen overflow-hidden items-center">
      <Outlet></Outlet>
    </main>
  )
}
