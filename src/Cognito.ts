// src/Cognito.ts
import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: import.meta.env.VITE_REACT_APP_COGNITO_USER_POOL_ID || "eu-west-1_B7ZC14JUB",
  ClientId: import.meta.env.VITE_REACT_APP_COGNITO_APP_CLIENT_ID || "9e053vrt8a0ksehf0b51g3tvi",
};

export default new CognitoUserPool(poolData);
console.log("Using Cognito ClientId =", poolData.ClientId);
