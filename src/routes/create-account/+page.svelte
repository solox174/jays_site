<script lang="ts">


    // TODO: let me know if event is not underlined in red in your IDE
    function validateForm(event: SubmitEvent) {
        event.preventDefault(); // Prevent actual form submission

        // Get the form element from the event
        const form = event.target as HTMLFormElement;

        // Option 1: Using FormData (best for modern browsers)
        const formData = new FormData(form);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm-password');

        if (password !== confirmPassword) {
            //Show user error
            return;
        }
        form.submit();
    }
</script>

<div class="glass-panel">
    <form method="post" class="grid-container" style="max-width: 350px; padding: 5px; margin: 0 auto">
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
            <input id="email-address" name="email" required type="email"/>
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
            <button onsubmit="{validateForm}" type="submit">Submit</button>
        </div>
    </form>
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
