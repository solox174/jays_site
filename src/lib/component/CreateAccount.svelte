<div class="glass-panel">
    <form method="post" style="width: min(400px, 100%); padding: 5px; margin: 0 auto">
        <div class="section-title">Create Account</div>
        <div style="display: flex; justify-content: space-between; width: 100%;">
            <fieldset
                    style="display: flex; border: none; width: auto; padding: 0; flex-direction: column; row-gap: 20px;">
                <div style="display: flex; flex-direction: column">
                    <label for="first-name">First Name:</label>
                    <input id="first-name" name="last-name" required type="text"/>
                </div>
                <div style="display: flex; flex-direction: column">
                    <label for="email">Email:</label>
                    <input id="email-address" name="email" required type="email"/>
                </div>
                <div style="display: flex; flex-direction: column">
                    <label for="password">Password:</label>
                    <input id="password" name="password" required type="password"/>
                </div>
            </fieldset>
            <fieldset
                    style="display: flex; border: none; width: auto; padding: 0; flex-direction: column; row-gap: 20px;">
                <div style="display: flex; flex-direction: column">
                    <label for="last-name">Last Name:</label>
                    <input id="last-name" name="last-name" required type="text"/>
                </div>
                <div style="display: flex; flex-direction: column">
                    <label for="phone-number">Phone Number:</label>
                    <input id="phone-number" name="phone-number" required type="number"/>
                </div>
                <div style="display: flex; flex-direction: column">
                    <label for="confirm-password">Confirm Password:</label>
                    <input id="confirm-password" name="confirm-password" required type="password"/>
                </div>
            </fieldset>
        </div>
        <button style="float: right; margin-top: 20px" type="submit">Submit</button>
    </form>
</div>

<style>
    label {
        font-weight: 500;
    }

    input {
        margin-top: 5px;
        width: 150px;
    }
</style>