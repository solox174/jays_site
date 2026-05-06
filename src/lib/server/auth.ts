import {
    AuthFlowType,
    CognitoIdentityProviderClient,
    ConfirmSignUpCommand,
    GlobalSignOutCommand,
    InitiateAuthCommand,
    SignUpCommand
} from '@aws-sdk/Daclclient-auth-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { Cookies } from '@sveltejs/kit';
import type { Schema } from '../../../amplify/data/resource';

const region = process.env.AWS_REGION!;
const userPoolId = process.env.COGNITO_USER_POOL_ID!;
const clientId = process.env.COGNITO_CLIENT_ID!;

const auth = new CognitoIdentityProviderClient({ region });

const accessVerifier = CognitoJwtVerifier.create({
    userPoolId,
    tokenUse: 'access',
    clientId
});

const idVerifier = CognitoJwtVerifier.create({
    userPoolId,
    tokenUse: 'id',
    clientId
});

type SessionUser = {
    sub: string;
    email?: string;
};

const inMemorySessions = new Map<string, SessionUser>();

function setSessionCookie(cookies: Cookies, sessionId: string) {
    cookies.set('session', sessionId, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
    });
}

function clearSessionCookie(cookies: Cookies) {
    cookies.delete('session', { path: '/' });
}

async function createSession(user: SessionUser) {
    const sessionId = crypto.randomUUID();
    inMemorySessions.set(sessionId, user);
    return sessionId;
}

export async function getSession(sessionId?: string | null) {
    if (!sessionId) return null;
    return inMemorySessions.get(sessionId) ?? null;
}

export async function signup(user: Schema['Customer']['createType']) {
    const response = await auth.send(new SignUpCommand({
        ClientId: clientId,
        Username: user.email!,
        Password: user.password!,
        UserAttributes: [
            { Name: 'email', Value: user.email! },
            { Name: 'given_name', Value: user.firstName ?? '' },
            { Name: 'family_name', Value: user.lastName ?? '' },
            ...(user.phoneNumber ? [{ Name: 'phone_number', Value: user.phoneNumber }] : [])
        ]
    }));

    return {
        ok: true as const,
        userConfirmed: response.UserConfirmed ?? false,
        userSub: response.UserSub
    };
}

export async function confirmSignup(username: string, code: string) {
    await auth.send(new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: username,
        ConfirmationCode: code
    }));

    return { ok: true as const };
}

export async function login(username: string, password: string, cookies: Cookies) {
    const response = await auth.send(new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: clientId,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password
        }
    }));

    if (!response.AuthenticationResult?.AccessToken || !response.AuthenticationResult?.IdToken) {
        return {
            ok: false as const,
            challengeName: response.ChallengeName
        };
    }

    const accessToken = response.AuthenticationResult.AccessToken;
    const idToken = response.AuthenticationResult.IdToken;

    const [accessPayload, idPayload] = await Promise.all([
        accessVerifier.verify(accessToken),
        idVerifier.verify(idToken)
    ]);

    const sessionId = await createSession({
        sub: accessPayload.sub,
        email: typeof idPayload.email === 'string' ? idPayload.email : undefined
    });

    setSessionCookie(cookies, sessionId);

    return {
        ok: true as const,
        user: {
            sub: accessPayload.sub,
            email: typeof idPayload.email === 'string' ? idPayload.email : undefined
        },
        accessToken
    };
}

export async function logout(cookies: Cookies, accessToken?: string) {
    if (accessToken) {
        await auth.send(new GlobalSignOutCommand({
            AccessToken: accessToken
        }));
    }

    const sessionId = cookies.get('session');
    if (sessionId) {
        inMemorySessions.delete(sessionId);
    }

    clearSessionCookie(cookies);

    return { ok: true as const };
}