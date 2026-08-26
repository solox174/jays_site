import {
    AuthFlowType,
    ChangePasswordCommand,
    CognitoIdentityProviderClient,
    ConfirmSignUpCommand,
    InitiateAuthCommand,
    NotAuthorizedException,
    ResendConfirmationCodeCommand,
    SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider';
import {CognitoJwtVerifier} from 'aws-jwt-verify';
import type {Cookies} from '@sveltejs/kit';
import {error} from '@sveltejs/kit';
import outputs from '../../../../../amplify_outputs.json';
import type {AuthService, NewUser} from '../types';

const region = outputs.auth.aws_region;
const userPoolId = outputs.auth.user_pool_id;
const clientId = outputs.auth.user_pool_client_id;

const cognitoClient = new CognitoIdentityProviderClient({region});
const idVerifier = CognitoJwtVerifier.create({userPoolId, tokenUse: 'id', clientId});
// Pre-fetch the Cognito JWKS (public keys) at startup so the first call to
// idVerifier.verify() doesn't block waiting for a network round-trip.
idVerifier.hydrate().catch(() => {});

const TOKEN_COOKIE = 'id_token';
const ACCESS_TOKEN_COOKIE = 'access_token';

function setSessionCookie(cookies: Cookies, name: string, token: string) {
    cookies.set(name, token, {
        path: '/',
        httpOnly: true,  // blocks JS access, mitigates XSS token theft
        secure: process.env.NODE_ENV === 'production',  // HTTPS-only in prod
        sameSite: 'lax',  // CSRF protection while allowing top-level navigations
        maxAge: 60 * 60
    });
}

export const cognitoAuthService: AuthService = {
    async signup(user: NewUser, password: string) {
        const response = await cognitoClient.send(new SignUpCommand({
            ClientId: clientId,
            Username: user.email,
            Password: password,
            UserAttributes: [
                {Name: 'email', Value: user.email},
                {Name: 'given_name', Value: user.firstName ?? ''},
                {Name: 'family_name', Value: user.lastName},
                ...(user.phoneNumber ? [{Name: 'phone_number', Value: user.phoneNumber}] : [])
            ]
        }));

        if (!response.UserSub) return {ok: false};

        return {
            ok: true,
            userConfirmed: response.UserConfirmed ?? false,
            userSub: response.UserSub
        };
    },

    async confirmSignup(username: string, code: string) {
        await cognitoClient.send(new ConfirmSignUpCommand({
            ClientId: clientId,
            Username: username,
            ConfirmationCode: code
        }));
    },

    async resendConfirmationCode(username: string) {
        await cognitoClient.send(new ResendConfirmationCodeCommand({
            ClientId: clientId,
            Username: username
        }));
    },

    async login(username: string, password: string, cookies: Cookies) {
        const response = await cognitoClient.send(new InitiateAuthCommand({
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            ClientId: clientId,
            AuthParameters: {USERNAME: username, PASSWORD: password}
        }));

        if (!response.AuthenticationResult?.IdToken) {
            return {ok: false, challengeName: response.ChallengeName};
        }

        const idPayload = await idVerifier.verify(response.AuthenticationResult.IdToken);
        setSessionCookie(cookies, TOKEN_COOKIE, response.AuthenticationResult.IdToken);
        if (response.AuthenticationResult.AccessToken) {
            setSessionCookie(cookies, ACCESS_TOKEN_COOKIE, response.AuthenticationResult.AccessToken);
        }

        return {
            ok: true,
            user: {
                id: idPayload.sub,
                email: typeof idPayload.email === 'string' ? idPayload.email : undefined,
                firstName: typeof idPayload.given_name === 'string' ? idPayload.given_name : undefined,
                lastName: typeof idPayload.family_name === 'string' ? idPayload.family_name : undefined,
                phoneNumber: typeof idPayload.phone_number === 'string' ? idPayload.phone_number : undefined,
            }
        };
    },

    async logout(cookies: Cookies) {
        cookies.delete(TOKEN_COOKIE, {path: '/'});
        cookies.delete(ACCESS_TOKEN_COOKIE, {path: '/'});
    },

    async verifySession(cookies: Cookies) {
        const token = cookies.get(TOKEN_COOKIE);
        if (!token) return null;

      try {
            const payload =   await idVerifier.verify(token);

            if (typeof payload.email  !== 'string') {
                error(500, 'There was a problem retrieving your account. Please try again later.')
            }

            return {
                id: payload.sub,
                email: payload.email as string
            };
        } catch {
            // Expired or invalid token — clear the cookie and treat as logged out
            // rather than surfacing a 500 to the user.
            cookies.delete(TOKEN_COOKIE, {path: '/'});
            return null;
        }
    },

    async changePassword(accessToken: string, oldPassword: string, newPassword: string) {
        try {
            await cognitoClient.send(new ChangePasswordCommand({
                AccessToken: accessToken,
                PreviousPassword: oldPassword,
                ProposedPassword: newPassword
            }));
            return {ok: true};
        } catch (e) {
            // Wrong current password — a normal, expected user error, not worth
            // logging as a server failure.
            const errorText = e instanceof NotAuthorizedException
                ? 'Current password is incorrect'
                : e instanceof Error ? e.message : 'Failed to change password';
            return {ok: false, errorText};
        }
    }
};