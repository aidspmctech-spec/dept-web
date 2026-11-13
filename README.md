# Supabase SSR authentication patch

Files in this patch replace the corresponding files in the project:
- `middleware.ts`
- `lib/supabase/server.ts`
- `package.json`

## Apply

1. Back up the existing files.
2. Replace them with the versions in this patch.
3. From the project root run:

   ```bash
   npm install
   npm run build
   ```

   This updates `package-lock.json` to the newer `@supabase/ssr` version declared in package.json.
4. Commit both `package.json` and the newly generated `package-lock.json`.
5. Deploy to a Vercel Preview first, not directly to Production.

Keep the existing Vercel environment variable names:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not put service-role keys in middleware or browser code.

## Important

This patch fixes the deprecated cookie adapter, cookie-response replacement, redirect cookie propagation, and the middleware's use of `getUser()` for JWT verification. It does not by itself establish why the login POST returned the generic error. Check the Vercel Runtime Logs for `[AUTH][LOGIN] Sign-in failed` and the actual Supabase error message. Do not share tokens or secret values.

Test both authenticated and logged-out users in a Preview deployment before promoting it to Production.
