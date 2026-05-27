import {
    AuthFlowType,
    CognitoIdentityProviderClient,
    ConfirmSignUpCommand,
    InitiateAuthCommand,
    SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider';
import {CognitoJwtVerifier} from 'aws-jwt-verify';
import type {Cookies} from '@sveltejs/kit';
import {amplifyClient} from '$lib/client/amplifyClient';
import outputs from '../../../../../amplify_outputs.json';
import type {AuthService, NewUser} from '../types';

const region = outputs.auth.aws_region;
const userPoolId = outputs.auth.user_pool_id;
const clientId = outputs.auth.user_pool_client_id;

const cognitoClient = new CognitoIdentityProviderClient({region});

const accessVerifier = CognitoJwtVerifier.create({userPoolId, tokenUse: 'access', clientId});
const idVerifier = CognitoJwtVerifier.create({userPoolId, tokenUse: 'id', clientId});

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function setSessionCookie(cookies: Cookies, sessionId: string) {
    cookies.set('session', sessionId, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: SESSION_TTL_MS / 1000
    });
}

function clearSessionCookie(cookies: Cookies) {
    cookies.delete('session', {path: '/'});
}

async function createSession(sub: string, email?: string): Promise<string> {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    const {data} = await amplifyClient.models.Session.create({sub, email, expiresAt});
    return data!.id;
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

        if (!response.AuthenticationResult?.AccessToken || !response.AuthenticationResult?.IdToken) {
            return {ok: false, challengeName: response.ChallengeName};
        }

        const [accessPayload, idPayload] = await Promise.all([
            accessVerifier.verify(response.AuthenticationResult.AccessToken),
            idVerifier.verify(response.AuthenticationResult.IdToken)
        ]);

        const email = typeof idPayload.email === 'string' ? idPayload.email : undefined;
        const firstName = typeof idPayload.given_name === 'string' ? idPayload.given_name : undefined;
        const lastName = typeof idPayload.family_name === 'string' ? idPayload.family_name : undefined;
        const phoneNumber = typeof idPayload.phone_number === 'string' ? idPayload.phone_number : undefined;
        const sessionId = await createSession(accessPayload.sub, email);
        setSessionCookie(cookies, sessionId);

        return {ok: true, user: {id: accessPayload.sub, email, firstName, lastName, phoneNumber}};
    },

    async logout(cookies: Cookies) {
        const sessionId = cookies.get('session');
        if (sessionId) {
            await amplifyClient.models.Session.delete({id: sessionId});
        }
        clearSessionCookie(cookies);
    },

    async verifySession(sessionId?: string | null) {
        if (!sessionId) return null;
        const {data} = await amplifyClient.models.Session.get({id: sessionId});
        if (!data) return null;

        if (new Date(data.expiresAt) < new Date()) {
            await amplifyClient.models.Session.delete({id: sessionId});
            return null;
        }

        return {id: data.sub, email: data.email ?? undefined};
    }
};