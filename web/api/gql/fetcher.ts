import { getConfig } from '@/utils/config';
import { GraphQLClient } from 'graphql-request';
import { getUser } from '@/api/auth/authService'

const config = getConfig();
const url = config.graphqlEndpoint;

const client = new GraphQLClient(url);

export const fetcher = <TData, TVariables extends object | undefined>(
  query: string,
  variables?: TVariables
) => {
  return async (): Promise<TData> => {
    const user = await getUser();
    const token = user?.access_token;

    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const hasFile =
      variables &&
      Object.values(variables).some((v) => v instanceof File || v instanceof Blob);

    if (hasFile) {
      const formData = new FormData();

      formData.append(
        'operations',
        JSON.stringify({
          query,
          variables: { ...variables as any, file: null },
        })
      );

      formData.append(
        'map',
        JSON.stringify({
          '0': ['variables.file'],
        })
      );

      const file = (variables as any).file as File;
      formData.append('0', file);

      const res = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      return json.data as TData;
    }

    return client.request(query, variables, headers);
  };
};
