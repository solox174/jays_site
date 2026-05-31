<script lang="ts">
    import {isBusy} from "$lib/stores/ui.svelte";
    import { page } from '$app/state';

    let {data, form} = $props();
    let firstLogin = $derived(page.url.searchParams.get('firstLogin'));
</script>

<div class="glass-panel">
    <div style="text-align: center; font-size: 0.9rem; font-weight: bold; margin-bottom: 20px">
        {#if form?.errorText}
            {form.errorText}
        {/if}
        {#if data?.from === '/scheduling'}
            Please log in to schedule service.
        {:else if firstLogin}
            Registration successful.
        {/if}
    </div>
    <form method="POST">
        <fieldset style="border: none;">
            <div style="max-width: 180px; display: flex; justify-content: center; flex-direction: column; margin: 0 auto; border: none; gap: 10px;">
                <label for="email-address">Email:</label>
                <input id="email-address" name="email" required type="email"/>
                <label for="password">Password:</label>
                <input id="password" name="password" required type="password"/>
                <div style="display: flex; justify-content: center; gap: 8px; margin-top: 10px;">
                    <a title="create account" href="/create-account">
                        <button type="button" class="secondary">Sign up</button>
                    </a>
                    <div style="display: flex; justify-content: center">
                        <button type="submit">Login</button>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 5px">
                    <a href="/forgot-password" style="color: var(--label-color); font-size: 0.8rem; text-decoration: none;">Forgot password?</a>
                </div>
            </div>
        </fieldset>
    </form>
</div>