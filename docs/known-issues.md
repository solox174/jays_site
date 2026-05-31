# Known Issues

## Amplify sandbox deadlock on first deployment with Lambda mutation handlers

**Symptom**

`npx ampx sandbox` fails with TypeScript errors like:

```
error TS2345: Argument of type 'LambdaProvidedEnvVars' is not assignable to parameter of type 'DataClientEnv'.
  Property 'AMPLIFY_DATA_DEFAULT_NAME' is missing in type 'LambdaProvidedEnvVars'
```

This affects every Lambda function that calls `createDataClient(env)`.

**Why it happens**

Amplify generates `.amplify/generated/env/<functionName>.ts` files after a successful deployment. These files declare which environment variables each Lambda receives at runtime, including `AMPLIFY_DATA_DEFAULT_NAME`, which is injected when a Lambda is wired as a mutation handler in the schema. Since `.amplify/` is gitignored, a fresh clone (or any situation where no successful deployment has run yet) has empty `AmplifyBackendEnvVars = {}` in all of those files. The sandbox type checker runs against these files *before* deploying, finds the missing property, and blocks deployment — the very action that would fix the files.

**Fix**

Add `AMPLIFY_DATA_DEFAULT_NAME: string` to `AmplifyBackendEnvVars` in every affected file under `.amplify/generated/env/`. 
Run 
```
./scripts/fixLambdas.py
``` 
from the project root

Then re-run `npx ampx sandbox`. Once the deployment succeeds, Amplify regenerates all files correctly and the issue won't recur until the next fresh clone.