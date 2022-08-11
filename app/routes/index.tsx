import { redirect } from '~/services/superjson'

export async function loader() {
  console.log(process.env)
  const babyId =
    process.env.NODE_ENV == 'production' &&
    process.env.URL == 'https://b-plus-plus.netlify.app'
      ? process.env.DEFAULT_BABY_ID
      : process.env.DEPLOY_PREVIEW_DEFAULT_BABY_ID
  return redirect(`/baby/${babyId}`)
}
