<div style="display: flex; justify-content: center; margin: 0 auto; padding: 30px 0; background: var(--glass-color); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: var(--border-radius)">
    <form method="post" style="width: min(400px, 100%); padding: 5px">
        <div class="section-title">Create Account</div>
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

<style>
    label {
        font-weight: 500;
    }
    input {
        margin-top: 5px;
        width: 150px;
    }
</style>