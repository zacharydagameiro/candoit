# find-suppliers

Supabase Edge Function that:

1. Loads a requirement by id
2. Marks it as `researching`
3. Runs supplier research
4. Upserts suppliers by website
5. Links them in `requirement_suppliers`
6. Marks the requirement as `matched` or `blocked`

## Request

`POST /functions/v1/find-suppliers`

```json
{
  "requirementId": "uuid"
}
```

It also accepts `POST /functions/v1/find-suppliers/:requirementId`.

## Environment

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PI_SEARCH_ENDPOINT` for a production-safe HTTP search backend
- `LOCAL_PI_SERVER_URL` for a host-local HTTP bridge such as `http://host.docker.internal:8787/find-suppliers`
- `PI_SEARCH_API_KEY` optional bearer token for `PI_SEARCH_ENDPOINT`
- `ALLOW_LOCAL_PI_COMMAND=true` to run `pi` directly in local development
- `FIND_SUPPLIERS_SHARED_SECRET` optional shared secret checked from `x-find-suppliers-secret`

## Local serve

```bash
supabase functions serve find-suppliers --env-file supabase/functions/.env
```

Example request:

```bash
curl -i \
  -X POST \
  'http://127.0.0.1:54321/functions/v1/find-suppliers' \
  -H 'Content-Type: application/json' \
  -d '{"requirementId":"00000000-0000-0000-0000-000000000000"}'
```

## Important constraint

Hosted Supabase Edge Functions should not depend on spawning a local CLI process. Use `PI_SEARCH_ENDPOINT` in production. `ALLOW_LOCAL_PI_COMMAND=true` is only intended for local development.

## Hackathon setup

Run a small host-side server:

```bash
npm run pi-search-server
```

Then set:

```bash
LOCAL_PI_SERVER_URL=http://host.docker.internal:8787/find-suppliers
```
