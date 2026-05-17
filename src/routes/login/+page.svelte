<script lang="ts">
    import type {ActionData} from './$types';

    export let form: ActionData;
</script>

<div class="glass-panel">
    <form method="POST">
        <fieldset style="width: 100%; border: none;">
            <div style="max-width: 250px; display: flex; justify-content: center; flex-direction: column; margin: 0 auto; border: none; gap: 10px;">
                <label for="email-address">Email:</label>
                <input id="email-address" name="email" required type="email"/>
                <label for="password">Password:</label>
                <input id="password" name="password" required type="password"/>
                {#if form?.message}
                    <p style="color: red;">{form.message}</p>
                {/if}
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                    <div style="display: flex; justify-content: space-evenly;">
                        <button type="submit">Login</button>
                        <!-- TODO: alt not valid on <a>. IDE flagged with red -->
                        <a alt="create account" href="/create-account">
                            <button type="button">Sign up</button>
                        </a>
                    </div>
                    <div style="display: flex; justify-content: center;">
                        <!--
                        TODO: use a CSS var (e.g. --label-color) — #ccc is illegible in light mode. always test both themes
                              looking great, otherwise
                        -->
                        <a href="/forgot-password"
                           style="color: var(--label-color); font-size: 0.8rem; text-decoration: none;">Forgot
                            password?</a>
                    </div>
                </div>
            </div>
        </fieldset>
    </form>
</div>