<script lang="ts">
    import {enhance} from '$app/forms';

    let {form} = $props();
    let createAccountState = $derived(form?.state);
    let email = $state('');
</script>

<div class="glass-panel">
    {#if form?.errorText}{form.errorText}{/if}
    {#if createAccountState !== 'captureCode'}
    <form method="post" class="grid-container"
          use:enhance={() => {
              return async ({ result, update }) => {
                  await update({ reset: false });
              };
          }}
          action="?/createAccount"
          style="max-width: 350px; padding: 5px; margin: 0 auto">
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
    <form method="post" action="?/confirmSignup" style="max-width: 400px; padding: 20px; margin: 0 auto; text-align: justify">
        <label for="confirmation-code">Confirm Your Email</label>
        <p>Thank you for signing up with Jay's Auto Detailing! Almost there — just one more step before we let you in! We've sent a confirmation code to your email. Please enter it below to verify your account.</p>
        <label for="confirmation-code" style="text-align: center; display: block">Confirmation Code:</label>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 10px">
            <input id="confirmation-code" name="confirmation-code" required type="password" style="width: 150px"/>
            <input name="email" bind:value={email} type="hidden"/>
            <button type="submit">Verify Code</button>
        </div>
    </form>
    {/if}
</div>

<style>
    label {
        font-weight: 500;
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
