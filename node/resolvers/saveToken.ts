export default function saveToken(
  _: any,
  { token }: { token: string },
  ctx: Context
) {
  return ctx.clients.vbase
    .saveJSON('account.example', 'configs', { token })
    .then((_) => 'success')
}
