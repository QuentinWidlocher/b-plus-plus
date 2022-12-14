import { Form, Link, useTransition } from '@remix-run/react'
import {
  Bell,
  LogOut,
  MoreHoriz,
  NavArrowDown,
  Plus,
  RefreshDouble,
  RemoveEmpty,
  StatsSquareUp,
} from 'iconoir-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import type { Baby } from '~/services/babies.server'
import LoadingItem from '../loading-item'

export type TitleBarProps = {
  babyId: string
  babyName: string
  babies: Baby[]
  tab: string
  hasNewNotifications: boolean
}

export default function TitleBar({
  babyId,
  babyName,
  babies,
  tab,
  hasNewNotifications,
}: TitleBarProps) {
  let transition = useTransition()
  let [refToUnfocus, setRef] = useState<HTMLElement | null>(null)
  let [confirm, setConfirm] = useState(false)

  function onDeleteClick(e: FormEvent<HTMLFormElement>) {
    if (!confirm) {
      e.preventDefault()
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)
    }
  }

  useEffect(() => {
    if (transition.state == 'idle' && refToUnfocus) {
      refToUnfocus.blur()
      setRef(null)
    }
  }, [transition.state])

  return (
    <Form method="post" onSubmit={(e) => onDeleteClick(e)}>
      <div className="flex justify-between mb-2 card-title">
        <div className="flex space-x-2">
          <div className="dropdown">
            <label className="flex items-center space-x-2" tabIndex={0}>
              <span>{babyName}</span> <NavArrowDown className="text-sm" />
            </label>
            <ul
              tabIndex={0}
              className="p-2 shadow dropdown-content menu bg-base-100 rounded-box w-72"
            >
              {babies.map((baby) => (
                <li key={baby.id}>
                  <Link
                    className={baby.id == babyId ? 'active' : ''}
                    onClick={(e: { currentTarget: any }) => {
                      setRef(e.currentTarget)
                    }}
                    to={`/baby/${baby.id}`}
                  >
                    {baby.name}
                  </Link>
                </li>
              ))}
              <li></li>
              <li>
                <Link to={`/baby/new`}>
                  <Plus />
                  <span>Nouveau bébé !</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="m-1 btn btn-square btn-ghost">
            <MoreHoriz />
          </label>
          <ul
            tabIndex={0}
            className="p-2 shadow dropdown-content menu bg-base-100 rounded-box w-72"
          >
            <li>
              <LoadingItem
                type="button"
                onClick={() => window.location.reload()}
                label="Rafraîchir la page"
                icon={<RefreshDouble />}
              />
            </li>
            {tab == 'bottles' ? (
              <li>
                <LoadingItem
                  type="link"
                  to={`/baby/${babyId}/bottle/stats`}
                  label="Voir l'évolution"
                  icon={<StatsSquareUp />}
                />
              </li>
            ) : null}
            {tab == 'sleeps' ? (
              <li>
                <LoadingItem
                  type="link"
                  to={`/baby/${babyId}/sleep/stats`}
                  label="Évolution du sommeil"
                  icon={<StatsSquareUp />}
                />
              </li>
            ) : null}
            <li>
              <LoadingItem
                type="link"
                to="/notifications"
                label="Notifications"
                icon={
                  hasNewNotifications ? (
                    <div className="indicator">
                      <span className="indicator-item indicator-bottom badge badge-xs badge-secondary"></span>
                      <Bell />
                    </div>
                  ) : (
                    <Bell />
                  )
                }
              />
            </li>
            <li>
              <LoadingItem
                type="link"
                to={`/logout`}
                label="Déconnexion"
                icon={<LogOut />}
              />
            </li>
            <li></li>
            <li
              className={`tooltip tooltip-error ${
                confirm ? 'tooltip-open' : ''
              }`}
              data-tip="La suppression est définitive, vous perdrez l'accès à toutes les données de ce bébé."
            >
              <button
                className={`w-full ${
                  confirm
                    ? 'text-error-content bg-error'
                    : 'text-error focus:bg-error focus:text-error-content'
                }`}
                title={confirm ? 'Confirmer la suppression' : 'Supprimer'}
                onClick={(e) => {
                  if (confirm) {
                    setRef(e.currentTarget)
                  }
                }}
              >
                <RemoveEmpty />
                <span>{confirm ? 'Confirmer' : `Supprimer ${babyName}`}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Form>
  )
}
