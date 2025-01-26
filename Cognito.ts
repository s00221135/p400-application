import { CognitoUserPool } from 'amazon-cognito-identity-js';

// If using Create React App, use process.env.REACT_APP_...
const poolData = {
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID ?? 'eu-west-1_B7ZC14JUB',
  ClientId: process.env.REACT_APP_COGNITO_APP_CLIENT_ID ?? '91urn2s5e4hbb1psb0ivopn4p',
};

export default new CognitoUserPool(poolData);
