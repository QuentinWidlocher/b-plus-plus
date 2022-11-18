import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { withZod } from '@remix-validated-form/with-zod'
import { format, isBefore, isToday, parse, parseISO } from 'date-fns'
import { Bin, NavArrowLeft, SaveFloppyDisk } from 'iconoir-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { ValidatedForm, validationError } from 'remix-validated-form'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import DateTimeInput from '~/components/form/date-time-input'
import SelectInput from '~/components/form/select-input'
import SubmitButton from '~/components/form/submit-button'
import BottomCardLayout from '~/components/layouts/bottom-card'
import LoadingItem from '~/components/loading-item'
import type { Sleep } from '~/services/sleeps.server'
import {
  createSleep,
  deleteSleep,
  getSleep,
  updateSleep,
} from '~/services/sleeps.server'

const schema = z
  .object({
    _action: z.literal('update'),
    description: zfd.text(
      z.undefined().or(
        z
          .string({
            invalid_type_error: 'La description est invalide',
          })
          .max(50, 'La description doit faire moins de 50 caractères'),
      ),
    ),
    start: z
      .string()
      .min(1, { message: 'La date doit être remplie' })
      .transform((x) => parseISO(x))
      .refine((date) => isBefore(date, new Date()), {
        message: 'La date doit être dans le passé',
      }),
    end: zfd
      .text(z.string().optional())
      .transform((x) => (x ? parseISO(x) : undefined))
      .refine((date) => !date || isBefore(date, new Date()), {
        message: 'La date doit être dans le passé',
      }),
  })
  .refine(({ start, end }) => !end || isBefore(start, end), {
    message: 'La date de fin doit être après la date de début',
    path: ['end'],
  })

const validator = withZod(schema)

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return {
    title: `Baily - ${data.sleep.id ? 'Modifier' : 'Ajouter'} un dodo`,
  }
}

export async function loader({ params }: LoaderArgs) {
  invariant(params.sleepId, 'sleep id is required')

  let sleep =
    params.sleepId === 'new' ? ({} as Sleep) : await getSleep(params.sleepId)

  return json({
    sleep,
  })
}

const prefillOptions = ['Agité', 'Normal']

export async function action({ request, params }: ActionArgs) {
  invariant(params.babyId, 'baby id is required')
  invariant(params.sleepId, 'sleep id is required')

  let action = (await request.clone().formData()).get('_action')?.toString()

  if (action == 'delete') {
    await deleteSleep(params.sleepId, params.babyId)
    return redirect(`/baby/${params.babyId}?tab=sleeps`)
  } else {
    let result = await validator.validate(await request.formData())

    if (result.error) {
      return validationError(result.error)
    }

    let sleep = result.data

    if (params.sleepId == 'new') {
      await createSleep(params.babyId, sleep)
    } else {
      await updateSleep({
        ...sleep,
        id: params.sleepId,
      })
    }

    return redirect(`/baby/${params.babyId}?tab=sleeps`)
  }
}

export default function SleepPage() {
  let { sleep } = useLoaderData<typeof loader>()

  let [confirm, setConfirm] = useState(false)

  function onDelete(e: FormEvent<HTMLFormElement>) {
    if (!confirm) {
      e.preventDefault()
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)
    }
  }

  return (
    <BottomCardLayout>
      <div className="flex justify-between">
        <LoadingItem
          type="link"
          to="./../..?tab=sleeps"
          className="mb-5 space-x-2 btn btn-ghost"
          title="Retour"
          icon={<NavArrowLeft />}
          label="Retour"
        ></LoadingItem>
        {sleep.id ? (
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
        <SelectInput
          name="description"
          options={prefillOptions}
          allowCustom
          defaultValue={sleep.description}
          label="Description"
        />
        <DateTimeInput
          name="start"
          label="Début"
          defaultValue={sleep.start ? new Date(sleep.start) : new Date()}
        />
        <DateTimeInput
          name="end"
          label="Fin"
          withSetNowButton
          defaultValue={sleep.end ? new Date(sleep.end) : undefined}
        />
        <SubmitButton
          icon={<SaveFloppyDisk />}
          label={`${sleep.id ? 'Modifier' : 'Ajouter'} ce dodo`}
          submittingLabel={sleep.id ? 'Modification' : 'Ajout'}
          className="mt-10 btn btn-primary"
        />
      </ValidatedForm>
    </BottomCardLayout>
  )
}
