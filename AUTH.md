# Authentication

This document covers the concepts behind the auth code added to this project, links to read more, and a walkthrough of each new file.

---

## Your Task: Build the Login Page

You've already built the create customer form, so you know the pattern. This is the same idea — a form that collects some input, sends it to the server, and does something with the result. The server side is already written. Your job is to build the page that talks to it.

### What "done" looks like

- A login page at `/login` with a username field, a password field, and a submit button
- Submitting the form with valid credentials logs you in and redirects to `/scheduling`
- Submitting with bad credentials shows an error message on the page (not an alert, not a console log — text on the page)
- The page looks consistent with the rest of the site

### What to create

**One new file:** `src/routes/login/+page.svelte`

The route directory (`src/routes/login/`) and the server action (`+page.server.ts`) already exist. SvelteKit will pair your new `+page.svelte` with the existing `+page.server.ts` automatically — same pattern as every other route in this project.

### How the form should be wired up

The form action expects two fields named `username` and `password`. The `name` attribute on your inputs is how the server knows which is which:

```html
<form method="POST">
    <input type="text" name="username" />
    <input type="password" name="password" />
    <button type="submit">Log in</button>
</form>
```

`method="POST"` tells the browser to send the form data to the server action instead of navigating to a new URL.

### Showing errors

When login fails, the server action returns an error. SvelteKit makes that available to your page through a `form` prop. At the top of your `<script>` block:

```ts
import type { ActionData } from './$types';
export let form: ActionData;
```

Then in your HTML, show the message if there is one:

```svelte
{#if form?.message}
    <p>{form.message}</p>
{/if}
```

### Where your work plugs in

Open `src/routes/scheduling/+page.svelte`. You'll see this:

```svelte
let loggedIn = false;
```

```svelte
{#if loggedIn}
    <AppointmentForm {deferredDataPromise} />
{:else}
    <CreateAccount/>
{/if}
```

Right now `loggedIn` is hardcoded to `false`, so `/scheduling` always shows the `CreateAccount` component — the appointment form is never reachable. That `CreateAccount` component is the form you already built.

The full intended flow once auth is wired up:

1. User visits `/scheduling` — not logged in, sees the create account / log in options
2. User logs in at `/login` → redirected back to `/scheduling`
3. Now `loggedIn` is `true` → they see the appointment form

Building the login page is what makes step 2 possible.

### Things to look at for reference

- The create customer form you already built — the structure is the same
- `+page.server.ts` in this directory — read what it sends back on success and failure so you know what to expect in the `form` prop
- [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions) — specifically the "Anatomy of an action" and "Validation errors" sections

---

## What's Not Done Yet

The code here is a foundation, not a finished system. Here's what's missing before auth actually works end to end:

### Missing UI

- **`src/routes/login/+page.svelte`** — The form action in `+page.server.ts` handles form submissions, but there's no HTML form yet. The login page is a dead end until this exists. (This is your current task.)
- **Signup wiring** — The `CreateAccount` component on `/scheduling` already has a form, but it submits to a stub action that does nothing. The `signup()` function in `auth.ts` is written and ready — it just needs a server action to call it.
- **`src/routes/signup/confirm/+page.svelte` and `+page.server.ts`** — After signup, Cognito emails a 6-digit code. There needs to be a page where the user can enter it to activate their account.

### Missing Logic

- **Logout route** — `logout()` is written in `auth.ts` but there's no route or button that calls it. Users have no way to log out.
- **Route protection** — `hooks.server.ts` identifies whether the user is logged in, but nothing actually *blocks* unauthenticated users from reaching `/scheduling` directly. The `{#if loggedIn}` in the svelte page handles this visually for now, but a proper guard lives on the server.
- **Redirect if already logged in** — If a logged-in user navigates to `/login`, they should be redirected to `/scheduling` automatically. Currently they'd just see the login form again.
- **Access token not stored** — `login()` verifies the access token and creates a session, but the access token itself isn't saved anywhere. `logout()` needs it to call Cognito's `GlobalSignOut`. Without it, logout only clears the local session — Cognito still considers the user logged in.

### Known Limitation

- **In-memory sessions** — Sessions are stored in a `Map` in memory. When the server restarts (or on Amplify, between Lambda invocations), that map is wiped and all sessions are lost. Users would be silently logged out. This needs a persistent store before production.

---

## The Problem Auth Solves

The web is **stateless**. That means every time your browser sends a request to a server, the server has no memory of any previous request. It treats every request as if it came from a complete stranger.

That's a problem when you want to build anything that has the concept of a "logged in" user. Without some mechanism to carry identity across requests, the server can never know who you are.

**Read:** [How the web works — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)

---

## Core Concepts

### Authentication vs Authorization

These two words get confused constantly.

- **Authentication** — proving who you are. (Showing your ID)
- **Authorization** — proving you're allowed to do something. (Being on the guest list)

Login is authentication. "Only admins can see this page" is authorization. The code in this project handles authentication.

---

### Cookies

A cookie is a small piece of text that the server can ask the browser to store and automatically send back with every future request. That's it. It's just a string the browser carries around on the server's behalf.

Cookies are what make stateless HTTP feel stateful. The server says "here, hold onto this" — the browser holds onto it — and now the server can recognize you on the next request.

The important flags on a cookie:

| Flag | What it does |
|------|-------------|
| `httpOnly` | JavaScript in the browser cannot read it. Protects against a class of attack called XSS. |
| `secure` | Only sent over HTTPS, never plain HTTP. |
| `sameSite` | Controls when the cookie is sent on cross-site requests. Protects against CSRF attacks. |
| `maxAge` | How long (in seconds) before the browser throws it away. |

**Read:** [HTTP Cookies — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)

---

### Sessions

A session is a record on the server that represents an ongoing interaction with a specific user.

Here's the pattern:

1. User logs in with their username and password.
2. Server verifies the credentials.
3. Server creates a **session** — a record that says "this random ID belongs to this user."
4. Server sends that random ID to the browser as a **cookie**.
5. On every future request, the browser sends the cookie automatically.
6. The server looks up the ID, finds the user, and knows who's asking.

The cookie only ever holds a random ID — never the user's password, never sensitive data. The actual user information lives on the server.

Think of it like a coat check. They give you a ticket (the cookie). The ticket means nothing to anyone who finds it without context. But when you hand it back, the server looks it up and knows exactly whose coat it is.

---

### Server Code vs Client Code

In a SvelteKit app, some code runs **in the browser** and some runs **on the server**. This distinction is critical for security.

- Code in `+page.svelte` — runs in the browser. Anyone can open DevTools and inspect it.
- Code in `+page.server.ts`, `hooks.server.ts`, or `lib/server/` — runs only on the server. The browser never sees it.

This is why secrets (passwords, API keys, database credentials) must only ever exist in server code. If a secret ends up in client code, it's exposed to anyone who opens DevTools.

The `.server.` in a filename is SvelteKit's convention for enforcing this — it will refuse to import a `.server.` file from client code.

---

### Environment Variables

Secrets that the code needs (like the Cognito client ID or AWS region) shouldn't be written directly into source code. If they were, they'd end up in git history and be visible to anyone who has the repository.

Instead, they're stored as **environment variables** — values that live in the server's environment outside of the code. In the code you'll see them accessed like this:

```ts
const region = process.env.AWS_REGION;
```

`process.env` is a special object that holds all the environment variables the server was started with. They never touch the codebase.

---

### Middleware and Hooks

Middleware is code that runs on **every single request**, before the request reaches its destination (a page, an API route, etc.). It's a checkpoint.

SvelteKit calls its middleware system **hooks**. The file `hooks.server.ts` exports a `handle` function that SvelteKit calls for every request.

The bouncer analogy: imagine every page in your app has a bouncer at the door. Instead of each bouncer independently checking IDs, there's one head bouncer at the building entrance who checks every person coming in and writes their name on a wristband. Every room's bouncer just reads the wristband.

`hooks.server.ts` is the head bouncer. `event.locals` is the wristband.

**Read:** [SvelteKit Hooks](https://svelte.dev/docs/kit/hooks)

---

### What Cognito Is

Cognito is Amazon's managed authentication service. It handles storing user accounts, hashing passwords securely, sending verification emails, and managing tokens.

You could build all of that yourself, but you probably shouldn't. Handling passwords securely is genuinely difficult to get right, and the consequences of getting it wrong (a data breach) are severe. Cognito is a battle-tested service that takes on that responsibility.

The code in this project talks to Cognito directly using the AWS SDK — sending commands like "sign this user up" or "log this user in" and getting tokens back.

**Read:** [What is Amazon Cognito?](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html)

---

### JWTs (JSON Web Tokens)

When Cognito verifies a login, it sends back a JWT. A JWT is a string that looks like gibberish but actually contains structured data and a cryptographic signature.

The signature is the key part. It's generated using a secret key only Cognito knows. That means:

- Anyone can **read** the contents of a JWT (it's just base64 encoded).
- Nobody can **fake** a JWT without the secret key.
- Our server can **verify** a JWT is genuinely from Cognito without calling Cognito again.

Think of it like a wax seal on a letter. Anyone can open and read the letter. But only the king's ring can make that seal — so if the seal is intact, you know it came from the king.

**Read:** [Introduction to JWTs — jwt.io](https://jwt.io/introduction)

---

### TypeScript: `declare global`

A TypeScript file that has any `import` or `export` in it is treated as a **module** — its types are local to that file. `declare global { }` is how you break out of that and add something to the global type scope.

`app.d.ts` uses this to tell TypeScript what `event.locals` looks like across the entire app. Without it, `event.locals.user` has no type and TypeScript can't help you catch mistakes.

---

## The New Files

### `src/app.d.ts`

```ts
declare global {
    namespace App {
        interface Locals {
            user: { sub: string; email?: string } | null;
        }
    }
}

export {};
```

SvelteKit defines several empty interfaces that apps are meant to fill in. `App.Locals` is the type of `event.locals` — the object the hook attaches user info to so every route can read it.

This file tells TypeScript: "`event.locals.user` is either an object with a `sub` and optional `email`, or `null` if nobody is logged in."

The `export {}` at the bottom makes the file a module (so `declare global` works correctly).

---

### `src/hooks.server.ts`

```ts
export const handle: Handle = async ({ event, resolve }) => {
    const sessionId = event.cookies.get('session');
    const session = await getSession(sessionId);

    event.locals.user = session
        ? { sub: session.sub, email: session.email }
        : null;

    return resolve(event);
};
```

This runs on every request before any page loads.

1. Read the `session` cookie from the request.
2. Look up that session ID in the session store.
3. If found, attach the user info to `event.locals`. If not, set it to `null`.
4. Call `resolve(event)` to let the request continue to its destination.

Every page and API route now has access to `event.locals.user`. If it's `null`, the user isn't logged in.

---

### `src/lib/server/auth.ts`

This file is the core of the auth system. It's in `lib/server/` so it can only ever be imported by server code.

**Setup (top of file)**

Creates the Cognito client using credentials from environment variables, and creates two JWT verifiers — one for the access token, one for the ID token. Cognito issues both when a user logs in. The access token proves the user is authenticated. The ID token carries profile information like email.

**`signup(user)`**

Sends a `SignUpCommand` to Cognito with the user's email, password, name, and phone number. Cognito stores the account and sends a verification email. The account isn't active until confirmed.

**`confirmSignup(username, code)`**

After signup, Cognito emails the user a 6-digit code. This function takes that code and tells Cognito "yes, this email address is real." The account becomes active.

**`login(username, password, cookies)`**

1. Sends the username and password to Cognito.
2. Cognito verifies them and returns an access token and ID token (both JWTs).
3. Our code verifies both tokens are genuine (not forged).
4. Creates a session and stores the user info in memory.
5. Sets the `session` cookie with the new session ID.

**`logout(cookies, accessToken?)`**

1. Calls Cognito's `GlobalSignOut` — this invalidates all tokens for the user across all devices.
2. Deletes the session from memory.
3. Clears the `session` cookie from the browser.

**A note on `inMemorySessions`**

The session store right now is just a `Map` in memory. This works for development but won't work in production on a serverless host where each request may start a fresh process with an empty map. A persistent store (like a database) is needed before this goes live.

---

### `src/routes/login/+page.server.ts`

```ts
export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const form = await request.formData();
        const username = String(form.get('username') ?? '');
        const password = String(form.get('password') ?? '');

        const result = await login(username, password, cookies);

        if (!result.ok) {
            return fail(400, { message: 'Login failed', challengeName: result.challengeName });
        }

        throw redirect(303, '/app');
    }
};
```

SvelteKit form actions are server-side functions that handle HTML form submissions.

**Read:** [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions)

This action:
1. Reads the submitted form data (username and password).
2. Calls the `login()` function from `auth.ts`.
3. If login fails, returns an error the page can display.
4. If login succeeds, redirects the user to `/app`.

The corresponding `+page.svelte` (not yet written) will have the HTML form that submits to this action.