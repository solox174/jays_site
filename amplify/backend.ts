import { defineBackend } from '@aws-amplify/backend';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function as CdkFunction } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { userCleanup } from './functions/user-cleanup-cron/resource';

const backend = defineBackend({
  auth,
  data,
  userCleanup,
});

const { cfnUserPoolClient } = backend.auth.resources.cfnResources;
cfnUserPoolClient.explicitAuthFlows = [
    'ALLOW_USER_PASSWORD_AUTH',
    'ALLOW_USER_SRP_AUTH',
    'ALLOW_REFRESH_TOKEN_AUTH',
];

// user-cleanup needs to list/delete Cognito users — not granted by default, since
// defineFunction doesn't know which resources a function needs access to.
// resources.lambda is typed as the CDK IFunction interface (no addEnvironment), but the
// concrete construct underneath is always a Function (NodejsFunction extends it) — this
// cast is the standard escape hatch for reaching function-specific methods.
const userPool = backend.auth.resources.userPool;
const userCleanupFn = backend.userCleanup.resources.lambda as CdkFunction;
userCleanupFn.addEnvironment('USER_POOL_ID', userPool.userPoolId);
userCleanupFn.role?.attachInlinePolicy(new Policy(
    userCleanupFn,
    'UserCleanupCognitoPolicy',
    {
        statements: [
            new PolicyStatement({
                actions: ['cognito-idp:ListUsers', 'cognito-idp:AdminDeleteUser'],
                resources: [userPool.userPoolArn]
            })
        ]
    }
));