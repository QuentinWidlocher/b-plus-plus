import { ActionArgs, json, LoaderArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { format, isBefore, parseISO, parse } from 'date-fns'
import { Bin, NavArrowLeft, SaveFloppyDisk } from 'iconoir-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { ValidatedForm, validationError } from 'remix-validated-form'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import LoadingItem from '~/components/loading-item'
import type { Bottle } from '~/services/bottles.server'
import {
  createBottle,
  deleteBottle,
  getBottle,
  updateBottle,
} from '~/services/bottles.server'
import { adjustedForDST } from '~/services/time'
import { withZod } from '@remix-validated-form/with-zod'
import DateTimeInput from '~/components/form/date-time-input'
import Input from '~/components/form/input'
import SubmitButton from '~/components/form/submit-button'
import { Form, useLoaderData } from '@remix-run/react'

const schema = z.object({
  _action: z.literal('update'),
  quantity: zfd.numeric(
    z.number({
      required_error: 'La quantité est requise',
      invalid_type_error: 'La quantité est invalide',
    }),
  ),
  date: z.object({
    date: z
      .string()
      .min(1, { message: 'La date doit être remplie' })
      .transform((x) => parseISO(x))
      .refine((date) => isBefore(date, new Date()), {
        message: 'La date doit être dans le passé',
      }),
    time: z
      .string()
      .min(1, { message: "L'heure doit être remplie" })
      .regex(/^\d{2}:\d{2}/, {
        message: 'Le format doit être hh:mm',
      }),
  }),
})

const validator = withZod(schema)

export async function loader({ params }: LoaderArgs) {
  invariant(params.bottleId, 'bottle id is required')

  let bottle =
    params.bottleId === 'new'
      ? ({} as Bottle)
      : await getBottle(params.bottleId)

  return json({
    bottle,
  })
}

export async function action({ request, params }: ActionArgs) {
  invariant(params.babyId, 'baby id is required')
  invariant(params.bottleId, 'bottle id is required')

  let action = (await request.clone().formData()).get('_action')?.toString()

  if (action == 'delete') {
    await deleteBottle(params.bottleId, params.babyId)
    return redirect(`/baby/${params.babyId}?tab=bottles`)
  } else {
    let result = await validator.validate(await request.formData())

    if (result.error) {
      return validationError(result.error)
    }

    let bottle = result.data

    let [hours, minutes] = bottle.date.time.split(':')

    let time = parse(
      `${format(bottle.date.date, 'yyyy-MM-dd')} ${hours}:${minutes}`,
      'yyyy-MM-dd HH:mm',
      new Date(),
    )

    time = adjustedForDST(time)

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

    return redirect(`/baby/${params.babyId}?tab=bottles`)
  }
}

export default function BottlePage() {
  let { bottle } = useLoaderData<typeof loader>()
  let [confirm, setConfirm] = useState(false)
  let [sliderQuantity, setSliderQuantity] = useState(bottle.quantity ?? 140)

  function onDelete(e: FormEvent<HTMLFormElement>) {
    if (!confirm) {
      e.preventDefault()
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)
    }
  }

  return (
    <>
      <div className="flex px-5 flex-col-reverse flex-1 w-full mb-5 align-middle md:mb-0 md:flex-col">
        <input
          type="range"
          min="40"
          max="240"
          value={sliderQuantity || 0}
          onChange={(e) => setSliderQuantity(e.target.valueAsNumber)}
          className="range"
          step="5"
        />
        <div className="flex justify-between w-full px-2 text-xs">
          <span>40</span>
          <span>65</span>
          <span>90</span>
          <span>115</span>
          <span>140</span>
          <span>165</span>
          <span>190</span>
          <span>115</span>
          <span>240</span>
        </div>
        <span className="my-auto text-6xl text-center">
          {sliderQuantity || 0} ml
        </span>
      </div>
      <section className="card max-sm:rounded-b-none md:mb-auto bg-base-200 w-full md:w-96">
        <div className="card-body">
          <div className="flex justify-between">
            <LoadingItem
              type="link"
              to="./../..?tab=bottles"
              className="mb-5 space-x-2 btn btn-ghost"
              title="Retour"
              icon={<NavArrowLeft />}
              label="Retour"
            />
            {bottle.id ? (
              <Form method="post" onSubmit={onDelete}>
                <input hidden name="_action" value="delete" readOnly />
                <button
                  className={`btn ${
                    confirm ? 'btn-error' : 'btn-square btn-ghost text-error'
                  }`}
                  title={confirm ? 'Confirmer la suppression' : 'Supprimer'}
                >
                  {confirm ? <span className="mr-1">Confirmer</span> : ''}
                  <Bin />
                </button>
              </Form>
            ) : null}
          </div>

          <ValidatedForm
            validator={validator}
            method="post"
            className="flex flex-col"
          >
            <input name="_action" hidden value="update" readOnly />
            <DateTimeInput
              name="date"
              label="Date et heure"
              defaultValue={bottle.time ? new Date(bottle.time) : new Date()}
            />
            <Input
              name="quantity"
              type="number"
              label="Quantité donnée"
              value={String(sliderQuantity)}
              onChange={(e) => {
                setSliderQuantity(e.target.valueAsNumber)
              }}
            />
            <SubmitButton
              icon={<SaveFloppyDisk />}
              label={`${bottle.id ? 'Modifier' : 'Ajouter'} ce biberon`}
              submittingLabel={bottle.id ? 'Modification' : 'Ajout'}
              className="mt-10 btn btn-primary"
            />
          </ValidatedForm>
        </div>
      </section>
    </>
  )
}
