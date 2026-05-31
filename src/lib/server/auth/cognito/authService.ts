import {
    AuthFlowType,
    CognitoIdentityProviderClient,
    ConfirmSignUpCommand,
    InitiateAuthCommand,
    SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider';
import {CognitoJwtVerifier} from 'aws-jwt-verify';
import type {Cookies} from '@sveltejs/kit';
import outputs from '../../../../../amplify_outputs.json';
import type {AuthService, NewUser} from '../types';

const region = outputs.auth.aws_region;
const userPoolId = outputs.auth.user_pool_id;
const clientId = outputs.auth.user_pool_client_id;

const cognitoClient = new CognitoIdentityProviderClient({region});
const idVerifier = CognitoJwtVerifier.create({userPoolId, tokenUse: 'id', clientId});

const TOKEN_COOKIE = 'id_token';

function setTokenCookie(cookies: Cookies, token: string) {
    cookies.set(TOKEN_COOKIE, token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
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
        setTokenCookie(cookies, response.AuthenticationResult.IdToken);

        return {
            ok: true,
            user: {
                id: idPayload.sub,
                email: typeof idPayload.email === 'string' ? idPayload.email : undefined
            }
        };
    },

    async logout(cookies: Cookies) {
        cookies.delete(TOKEN_COOKIE, {path: '/'});
    },

    async verifySession(cookies: Cookies) {
        const token = cookies.get(TOKEN_COOKIE);
        if (!token) return null;

        try {
            const payload = await idVerifier.verify(token);
            return {
                id: payload.sub,
                email: typeof payload.email === 'string' ? payload.email : undefined
            };
        } catch {
            cookies.delete(TOKEN_COOKIE, {path: '/'});
            return null;
        }
    }
};