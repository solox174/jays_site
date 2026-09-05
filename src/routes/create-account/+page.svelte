<script lang="ts">
    import {enhance} from '$app/forms';
    import {PUBLIC_BUSINESS_NAME} from '$env/static/public';

    let {form} = $props();
    let createAccountState = $derived(form?.state);
    let email = $state('');

    // Client-side only — just stops impatient double-clicking, not abuse (that'd need
    // a server-side check in authService.resendConfirmationCode).
    let resendCooldown = $state(0);

    function startResendCooldown() {
        resendCooldown = 120;
    }

    $effect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => resendCooldown -= 1, 1000);
        return () => clearTimeout(timer);
    });
</script>

<svelte:head>
    <title>Create Account</title>
</svelte:head>

<div class="glass-panel">
    <div style="text-align: center; color: red; var(--brand-color): 1.1rem; font-weight: bold; margin: 20px 0">
        {#if form?.errorText}
            {form.errorText}
        {/if}
    </div>
    {#if createAccountState !== 'captureCode'}
    <form method="post" class="grid-container"
          use:enhance={() => {
              return async ({update}) => {
                  await update({ reset: false });
              };
          }}
          action="?/createAccount"
          style="max-width: 350px; padding: 5px; margin: 0 auto">
        <!-- Honeypot: invisible to real users (CSS-hidden, not type="hidden" — bots
             that specifically skip hidden inputs still often fill this). Checked
             server-side in the createAccount action. -->
        <div aria-hidden="true" class="honeypot">
            <label for="website">Website</label>
            <input autocomplete="off" id="website" name="website" tabindex="-1" type="text"/>
        </div>

        <div class="grid-item" style="display: flex; flex-direction: column">
            <label for="first-name">First Name:</label>
            <input id="first-name" name="first-name" required type="text"/>
        </div>
        <div class="grid-item" style="display: flex; flex-direction: column">
            <label for="last-name">Last Name:</label>
            <input id="last-name" name="last-name" required type="text"/>
        </div>
        <div class="grid-item" style="display: flex; flex-direction: column">
            <label for="email">Email:</label>
            <input id="email-address" name="email" bind:value={email} required type="email"/>
        </div>
        <div class="grid-item" style="display: flex; flex-direction: column">
            <label for="phone-number">Phone Number:</label>
            <input id="phone-number" name="phone-number" required type="tel"/>
        </div>
        <div class="grid-item" style="display: flex; flex-direction: column">
            <label for="password">Password:</label>
            <input id="password" name="password" required type="password"/>
        </div>
        <div class="grid-item" style="display: flex; flex-direction: column">
            <label for="confirm-password">Confirm Password:</label>
            <input id="confirm-password" name="confirm-password" required type="password"/>
        </div>
        <div style="grid-column: span 2; display: flex; justify-content: center; margin-top:20px">
            <button type="submit">Submit</button>
        </div>
    </form>
    {:else}
    <form method="post" action="?/confirmSignup"
          use:enhance={() => {
              return async ({update}) => {
                  await update({reset: false});
              };
          }}
          style="max-width: 400px; padding: 20px; margin: 0 auto; text-align: justify">
        <p>Thank you for signing up with {PUBLIC_BUSINESS_NAME}! Almost there — just one more step before we let you in! We've sent a confirmation code to your email. Please enter it below to verify your account.</p>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 10px">
            <input id="confirmation-code" name="confirmation-code" required type="text" style="width: 150px"/>
            <input name="email" bind:value={email} type="hidden"/>
            {#if form?.errorText}<div style="text-align: center">{form.errorText}</div>{/if}
            {#if form?.resent}<div style="text-align: center">A new code has been sent.</div>{/if}
            <button type="submit">Verify</button>
            <button type="submit" formaction="?/resendCode" class="bare-btn resend-link"
                    disabled={resendCooldown > 0} onclick={startResendCooldown}>
                    {resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend code'}
            </button>
        </div>
    </form>
    {/if}
</div>

<style>
    label {
        font-weight: 500;
    }

    .honeypot {
        position: absolute;
        left: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    }

    /* .bare-btn (global) already strips background/border/shadow and sets cursor —
       this just overrides its icon-button sizing for a small underlined text link.
       Also overrides its 0.55 opacity (meant for icon buttons) back to 1 — stacked on
       top of var(--label-color), that extra dimming made the text nearly illegible
       against the glass-panel background at rest. */
    .resend-link {
        opacity: 0.8;
        padding: 5px;
        color: canvasText;
        font-size: 0.8rem;
        text-transform: none;
        text-decoration: underline;
    }

    .resend-link:hover {
        opacity: 1;
    }

    .resend-link:disabled {
        opacity: 0.8;
        background:none;
        border: none;
        text-decoration: none;
    }

    input {
        margin-top: 5px;
        width: 100%;
        min-width: 0;
    }

    .grid-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(4, auto);
        column-gap: min(4vw, 35px);
    }

    .grid-item {
        padding-top: 24px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end; /* Pushes content to the bottom */
        align-items: stretch;
        min-width: 0;
    }
</style>
