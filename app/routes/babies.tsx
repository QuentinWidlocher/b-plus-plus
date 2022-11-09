import { useLoaderData } from '@remix-run/react'
import type { LoaderArgs } from '@remix-run/server-runtime'
import { redirect } from '@remix-run/server-runtime'
import LoadingItem from '~/components/loading-item'
import { getBabies } from '~/services/babies.server'
import { requireUserId } from '~/services/session.server'

export async function loader({ request }: LoaderArgs) {
  let uid = await requireUserId(request)

  let babies = await getBabies(uid)

  if (babies.length == 1) {
    throw redirect(`/baby/${babies[0].id}`)
  } else if (babies.length <= 0) {
    throw redirect(`/baby/new`)
  }

  return babies
}

export default function BabiesRoute() {
  let babies = useLoaderData<typeof loader>()
  return (
    <main className="py-2 md:py-5 px-2 flex flex-col h-screen overflow-hidden items-center">
      <section className="mt-auto md:my-auto w-full card max-sm:rounded-none bg-base-200 md:w-96">
        <div className="overflow-x-hidden overflow-y-auto card-body">
          <div className="flex justify-between mb-5 card-title">
            <h1 className="text-xl">Les petits bouts</h1>
          </div>

          <ul className="p-2 shadow dropdown-content menu bg-base-100 rounded-box">
            {babies.map((baby) => (
              <li key={baby.id}>
                <LoadingItem
                  key={baby.id}
                  type="link"
                  to={`/baby/${baby.id}`}
                  label={baby.name}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
