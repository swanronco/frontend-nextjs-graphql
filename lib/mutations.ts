// lib/mutations.ts
export const LOGIN_MUTATION = /* GraphQL */ `
  mutation Login($identifier: String!, $password: String!) {
    login(identifier: $identifier, password: $password) {
      token
      user {
        id
        username
        email
      }
    }
  }
`;

export const LOGOUT_MUTATION = /* GraphQL */ `
  mutation Logout($token: String!) {
    logout(token: $token) {
      success
      message
    }
  }
`;

export const SIGNUP_MUTATION = /* GraphQL */ `
  mutation SignUp($input: UserInput!) {
    createUser(input: $input) {
      firstName
      lastName
      email
      username
    }
  }
`;
