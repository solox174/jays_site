<script lang="ts">
    import type { ActionData } from './$types';
    export let form: ActionData;
</script>

<div style="display: flex; justify-content: center; margin: 0 auto; padding: 30px 0; width: 100%; background: var(--glass-color); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: var(--border-radius)">
    <form method="POST">
        <fieldset style="width: 100%; border: none;">
            <legend class="section-title">Login</legend>
            <div style="display: flex; justify-content: center; flex-direction: column; margin: 0 auto; border: none; gap: 10px;">
                <label for="email-address">Email:</label>
                <input id="email-address" name="email" type="email" required/>
                <label for="password">Password:</label>
                <input id="password" name="password" type="password" required/>
                {#if form?.message}
                    <p style="color: red;">{form.message}</p>
                {/if}
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                    <div style="display: flex; justify-content: space-evenly;">
                        <button type="submit">Login</button>
                        <a href="/create-account" alt="create account"> <button type="button">Sign up</button> </a>
                    </div>
                    <div style="display: flex; justify-content: center;">
                        <a href="/forgot-password" style="color: #ccc; font-size: 0.8rem; text-decoration: none;">Forgot password?</a>
                    </div>
                </div>
            </div>
        </fieldset>
    </form>
</div>