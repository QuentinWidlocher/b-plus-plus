import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { Form as BasicForm, Link } from '@remix-run/react'
import invariant from 'tiny-invariant'
import type { Bottle } from '~/services/firebase.server'
import {
  createBottle,
  deleteBottle,
  getBottle,
  updateBottle,
} from '~/services/firebase.server'
import { superjson, useSuperLoaderData } from '~/services/superjson'
import { Bin, NavArrowLeft } from 'iconoir-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { z } from 'zod'
import { Form, formAction } from 'remix-forms'
import { makeDomainFunction } from 'remix-domains'
import { dateToISOLikeButLocal } from '~/services/time'
import { isBefore, subHours } from 'date-fns'
import { SaveFloppyDisk } from 'iconoir-react'

const schema = z.object({
  _action: z.enum(['delete', 'update']),
  quantity: z.number({
    required_error: 'La quantité est requise',
    invalid_type_error: 'La quantité est requise',
  }),
  date: z
    .date({ invalid_type_error: 'La date doit être remplie' })
    .refine((date) => isBefore(date, new Date()), {
      message: 'La date doit être dans le passé',
    }),
  time: z
    .string()
    .min(1, { message: "L'heure doit être remplie" })
    .regex(/^[0-9]{2}:[0-9]{2}/, {
      message: 'Le format doit être hh:mm',
    }),
})

export async function loader({ params }: LoaderArgs) {
  invariant(params.bottleId, 'bottle id is required')

  let bottle =
    params.bottleId === 'new'
      ? ({} as Bottle)
      : await getBottle(params.bottleId)

  bottle.time = subHours(bottle.time, 2)

  return superjson({
    bottle,
  })
}

export async function action({ request, params }: ActionArgs) {
  let action = (await request.clone().formData()).get('_action')?.toString()
  console.log(action)

  if (action == 'delete') {
    invariant(params.babyId, 'baby id is required')
    invariant(params.bottleId, 'bottle id is required')

    await deleteBottle(params.bottleId, params.babyId)
    return redirect(`/baby/${params.babyId}`)
  } else {
    return formAction({
      request,
      schema,
      successPath: `/baby/${params.babyId}`,
      mutation: makeDomainFunction(schema)(async (values) => {
        let bottle = values

        invariant(params.babyId, 'baby id is required')
        invariant(params.bottleId, 'bottle id is required')

        let [hours, minutes] = bottle.time.split(':')
        let time = new Date(bottle.date)
        time.setHours(
          Number(hours),
          Number(minutes),
          new Date().getSeconds(),
          0,
        )

        if (params.bottleId == 'new') {
          await createBottle(params.babyId, {
            ...bottle,
            time,
          })
        } else {
          await updateBottle({
            ...bottle,
            id: params.bottleId,
            time,
          })
        }
      }),
    })
  }
}

export default function BottlePage() {
  let { bottle } = useSuperLoaderData<typeof loader>()
  let [confirm, setConfirm] = useState(false)

  function onDelete(e: FormEvent<HTMLFormElement>) {
    if (!confirm) {
      e.preventDefault()
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)
    }
  }

  return (
    <section className="card md:my-auto mt-auto bg-base-200 w-full md:w-96">
      <div className="card-body">
        <div className="flex justify-between">
          <Link
            to="./../.."
            className="btn btn-square btn-ghost mb-5"
            title="Retour"
          >
            <NavArrowLeft />
          </Link>
          {bottle.id ? (
            <Form schema={schema} onSubmit={onDelete}>
              {({ Field, Button }) => (
                <>
                  <Field hidden name="_action" value="delete" />
                  <Button
                    className={`btn ${
                      confirm ? 'btn-error' : 'btn-square btn-ghost text-error'
                    }`}
                    title={confirm ? 'Confirmer la suppression' : 'Supprimer'}
                  >
                    {confirm ? <span className="mr-1">Confirmer</span> : ''}
                    <Bin />
                  </Button>
                </>
              )}
            </Form>
          ) : null}
        </div>
        <Form schema={schema} method="post" className="flex flex-col">
          {({ Field, Errors, Button, register }) => (
            <>
              <Field name="_action" hidden value="update" />
              <Field name="quantity">
                {({ Label, Errors, SmartInput }) => (
                  <div className="form-control">
                    <Label className="label">
                      <span className="label-text text-lg">
                        Quantité donnée
                      </span>
                    </Label>
                    <label className="input-group">
                      <SmartInput
                        type="number"
                        value={bottle.quantity}
                        className="input w-full"
                      />
                      <span>ml</span>
                    </label>
                    <label className="label">
                      <span className="label-text-alt text-error">
                        <Errors />
                      </span>
                    </label>
                  </div>
                )}
              </Field>
              <Field name="date">
                {({ Label, Errors, SmartInput }) => (
                  <div className="form-control w-full">
                    <Label className="label">
                      <span className="label-text text-lg">Date</span>
                    </Label>
                    <SmartInput
                      type="date"
                      value={
                        dateToISOLikeButLocal(bottle.time ?? new Date()).split(
                          'T',
                        )[0]
                      }
                      className="input w-full"
                    />
                    <label className="label">
                      <span className="label-text-alt text-error">
                        <Errors />
                      </span>
                    </label>
                  </div>
                )}
              </Field>
              <Field name="time">
                {({ Label, Errors, SmartInput }) => {
                  let [hours, minutes] = (bottle.time ?? new Date())
                    .toLocaleTimeString()
                    .split(':')

                  return (
                    <div className="form-control w-full">
                      <Label className="label">
                        <span className="label-text text-lg">Heure</span>
                      </Label>
                      <SmartInput
                        type="time"
                        value={`${hours}:${minutes}`}
                        className="input w-full"
                      />
                      <label className="label">
                        <span className="label-text-alt text-error">
                          <Errors />
                        </span>
                      </label>
                    </div>
                  )
                }}
              </Field>
              <Button className="btn btn-primary w-full mt-10 space-x-2">
                <SaveFloppyDisk />
                <span>{bottle.id ? 'Modifier' : 'Ajouter'} ce biberon</span>
              </Button>
            </>
          )}
        </Form>
      </div>
    </section>
  )
}
