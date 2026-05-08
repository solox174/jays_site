<script>
</script>

<div style="display: flex; justify-content: center; margin: 0 auto;">
    <form method="post" style="width: min(400px, 100%)">
        <legend class="section-title">Create Account</legend>
        <div style="display: flex; justify-content: space-between; width: 100%;">
            <fieldset
                    style="display: flex; border: none; width: auto; padding: 0; flex-direction: column; row-gap: 20px;">
                <div style="display: flex; flex-direction: column">
                    <label for="first-name">First Name:</label>
                    <input id="first-name" name="last-name" type="text" required/>
                </div>
                <div style="display: flex; flex-direction: column">
                    <label for="email">Email:</label>
                    <input id="email-address" name="email" type="email" required/>
                </div>
                <div style="display: flex; flex-direction: column">
                    <label for="password">Password:</label>
                    <input id="password" name="password" type="password" required/>
                </div>
            </fieldset>
            <fieldset
                    style="display: flex; border: none; width: auto; padding: 0; flex-direction: column; row-gap: 20px;">
                <div style="display: flex; flex-direction: column">
                    <label for="last-name">Last Name:</label>
                    <input id="last-name" name="last-name" type="text" required/>
                </div>
                <div style="display: flex; flex-direction: column">
                    <label for="phone-number">Phone Number:</label>
                    <input id="phone-number" name="phone-number" type="number" required/>
                </div>
                <div style="display: flex; flex-direction: column">
                    <label for="confirm-password">Confirm Password:</label>
                    <input id="confirm-password" name="confirm-password" type="password" required/>
                </div>
            </fieldset>
        </div>
        <button type="submit" style="float: right; margin-top: 20px">Submit</button>
    </form>
</div>