import React, { FC, useState } from 'react'
import { useMutation, useQuery } from 'react-apollo'
import { Layout, PageBlock, Button, Input } from 'vtex.styleguide'
import saveTokenGQL from './graphql/saveToken.gql'
import tokenGQL from './graphql/token.gql'

const AdminExample: FC = () => {
  const [token, setToken] = useState('')
  useQuery(tokenGQL, { onCompleted: ({ token }) => setToken(token) })
  const [saveToken] = useMutation(saveTokenGQL)
  return (
    <Layout>
      <PageBlock
        title="Configuração de Token"
        subtitle="Explicação aqui dos tokens"
        variation="full"
      >
        <Input
          placeholder="API Token"
          value={token}
          onChange={(e: any) => setToken(e.target.value)}
        />
        <Button
          onClick={() => {
            saveToken({ variables: { token } })
          }}
        >
          Salvar
        </Button>
      </PageBlock>
    </Layout>
  )
}
export default AdminExample
