export default function token(_: any, __: any, ctx: Context) {
  return ctx.clients.vbase
    .getJSON<{ token: string }>('account.example', 'configs')
    .then(({ token }) => token)
}
