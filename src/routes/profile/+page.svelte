<script lang="ts">
    import {enhance} from '$app/forms';
    import type {PageProps} from './$types';

    let {data, form}: PageProps = $props();
</script>

<svelte:head>
    <title>Edit Profile</title>
</svelte:head>

<div class="glass-panel">
    <form method="post" action="?/updatePhone" use:enhance class="profile-form">
        <div class="field">
            <label for="phone-number">Phone Number:</label>
            <input id="phone-number" name="phone-number" required type="tel" value={data.phoneNumber}/>
        </div>
        {#if form?.form === 'phone' && form.errorText}
            <div class="message error">{form.errorText}</div>
        {:else if form?.form === 'phone' && form.success}
            <div class="message">Phone number updated.</div>
        {/if}
        <div class="submit-row">
            <button type="submit">Update Phone Number</button>
        </div>
    </form>

    <form method="post" action="?/updatePassword" class="profile-form"
          use:enhance={() => {
              return async ({update}) => {
                  await update({reset: true});
              };
          }}>
        <div class="field">
            <label for="current-password">Current Password:</label>
            <input id="current-password" name="current-password" required type="password"/>
        </div>
        <div class="field">
            <label for="new-password">New Password:</label>
            <input id="new-password" name="new-password" required type="password"/>
        </div>
        <div class="field">
            <label for="confirm-password">Confirm New Password:</label>
            <input id="confirm-password" name="confirm-password" required type="password"/>
        </div>
        {#if form?.form === 'password' && form.errorText}
            <div class="message error">{form.errorText}</div>
        {:else if form?.form === 'password' && form.success}
            <div class="message">Password updated.</div>
        {/if}
        <div class="submit-row">
            <button type="submit">Change Password</button>
        </div>
    </form>
</div>

<style>
    .profile-form {
        max-width: 300px;
        margin: 0 auto 30px;
    }

    .profile-form:last-child {
        margin-bottom: 0;
    }

    .field {
        padding-top: 24px;
        display: flex;
        flex-direction: column;
    }

    label {
        font-weight: 500;
    }

    input {
        margin-top: 5px;
        width: 100%;
        min-width: 0;
    }

    .message {
        text-align: center;
        font-size: 0.9rem;
        margin-top: 10px;
    }

    .message.error {
        color: var(--brand-color);
    }

    .submit-row {
        display: flex;
        justify-content: center;
        margin-top: 20px;
    }
</style>
