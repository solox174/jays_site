import {
    AuthFlowType,
    CognitoIdentityProviderClient,
    ConfirmSignUpCommand,
    InitiateAuthCommand,
    SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider';
import {CognitoJwtVerifier} from 'aws-jwt-verify';
import type {Cookies} from '@sveltejs/kit';
import type {Schema} from '../../../amplify/data/resource';
import {amplifyClient} from '../client/amplifyClient';
import outputs from '../../../amplify_outputs.json';

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

export async function verifySession(sessionId?: string | null): Promise<{ sub: string; email?: string } | null> {
    if (!sessionId) return null;
    const {data} = await amplifyClient.models.Session.get({id: sessionId});
    if (!data) return null;

    if (new Date(data.expiresAt) < new Date()) {
        await amplifyClient.models.Session.delete({id: sessionId});
        return null;
    }

    return {sub: data.sub, email: data.email ?? undefined};
}

export async function signup(user: Schema['Customer']['createType']) {
    const response = await cognitoClient.send(new SignUpCommand({
        ClientId: clientId,
        Username: user.email!,
        Password: user.password!,
        UserAttributes: [
            {Name: 'email', Value: user.email!},
            {Name: 'given_name', Value: user.firstName ?? ''},
            {Name: 'family_name', Value: user.lastName ?? ''},
            ...(user.phoneNumber ? [{Name: 'phone_number', Value: user.phoneNumber}] : [])
        ]
    }));

    return {
        ok: true as const,
        userConfirmed: response.UserConfirmed ?? false,
        userSub: response.UserSub
    };
}

export async function confirmSignup(username: string, code: string) {
    await cognitoClient.send(new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: username,
        ConfirmationCode: code
    }));

    return {ok: true as const};
}

export async function login(username: string, password: string, cookies: Cookies) {
    const response = await cognitoClient.send(new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: clientId,
        AuthParameters: {USERNAME: username, PASSWORD: password}
    }));

    if (!response.AuthenticationResult?.AccessToken || !response.AuthenticationResult?.IdToken) {
        return {ok: false as const, challengeName: response.ChallengeName};
    }

    const [accessPayload, idPayload] = await Promise.all([
        accessVerifier.verify(response.AuthenticationResult.AccessToken),
        idVerifier.verify(response.AuthenticationResult.IdToken)
    ]);

    const email = typeof idPayload.email === 'string' ? idPayload.email : undefined;
    const sessionId = await createSession(accessPayload.sub, email);
    setSessionCookie(cookies, sessionId);

    return {ok: true as const, user: {sub: accessPayload.sub, email}};
}

export async function logout(cookies: Cookies) {
    const sessionId = cookies.get('session');
    if (sessionId) {
        await amplifyClient.models.Session.delete({id: sessionId});
    }
    clearSessionCookie(cookies);
    return {ok: true as const};
}