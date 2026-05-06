<script>
</script>


<div style="display: flex; justify-content: center; margin: 0 auto;">
    <form method="post">
        <legend class="section-title">Create Account</legend>
        <div style="display: flex; justify-content: space-between; width: 400px; margin: 0 auto;">
            <fieldset
                    style="display: flex; justify-content: space-between; border: none;  width: 100px; padding: 0; flex-direction: column; row-gap: 20px; ">
                <div>
                    <label for="first-name">First Name:</label>
                    <input id="first-name" name="last-name" type="text" required/>
                </div>
                <div>
                    <label for="email">Email:</label>
                    <input id="email-address" name="email" type="email" required/>
                </div>
                <div>
                    <label for="password">Password:</label>
                    <input id="password" name="password" type="password" required/>
                </div>

            </fieldset>
            <fieldset
                    style="display: flex; justify-content: space-between; border: none; width: 100px; padding: 0; flex-direction: column; row-gap: 20px;">
                <div>
                    <label for="last-name">Last Name:</label>
                    <input id="last-name" name="last-name" type="text" required/>
                </div>
                <div>
                    <label for="phone-number">Phone Number:</label>
                    <input id="phone-number" name="phone-number" type="number" required/>
                </div>
                <div>
                    <label for="confirm-password">Confirm Password:</label>
                    <input id="confirm-password" name="confirm-password" type="password" required/>
                </div>
            </fieldset>
        </div>
        <button type="submit" style="float: right; margin-top: 20px">Submit</button>
    </form>
</div>