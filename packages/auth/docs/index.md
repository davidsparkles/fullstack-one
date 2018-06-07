# FullstackOne Auth

This package creates all pg-auth-functions and auth-mutations required for using FullstackOne with autheticated users. Also it simplifies oAuth with providers like Facebook and Google.

## Basics

### The `_meta.Auth` table

The auth package has multiple settings which are set inside PostgreSQL. They are saved in the `_meta.Auth` table:

The `_meta.Auth` table is a key-value table containing these keys:

name | description | example-value
--- | --- | ---
admin_token_secret | Secret for the admin token. Needs to be in sync with the one definded in node.js | someAdminSecret123
auth_table_schema | The table-schema which is used as `User` table. Set by FullstackOne | public
auth_table | The table which is used as `User` table. Set by FullstackOne | User
auth_field_tenant | The tenant field which is used inside the `User` table. Set by FullstackOne | tenant
auth_field_username | The username field which is used inside the `User` table. Set by FullstackOne | username
auth_field_password | The password field which is used inside the `User` table. Set by FullstackOne | password
auth_providers | With `:` seperated auth-providers. Must contain `local`. | local:facebook:google
auth_pw_secret | Secret for signing passwords. (They are hashed twice before) | somePasswordSecret123
bf_iter_count | Blowfish iteration count. Strength of hashing tokens inside PostgreSQL | 6
pw_bf_iter_count | Blowfish iteration count. Strength of hashing passwords inside PostgreSQL | 6
transaction_token_max_age_in_seconds | The max-age in seconds of a transaction-token-secret. (Usually one day) | 86400
transaction_token_secret | Secret to sign the transaction-token. Will be changed by the application regulary. | $2a$04$fKWWjOgBPRXXoyUYY.woAuXEfOsv.L2jnNJ1n6buLFUwb6Amfv3ty
transaction_token_timestamp | Last time the transaction-token-secret has been changed. | 1527972758
user_token_max_age_in_seconds | Max-age of the user-token in seconds. | 1209600
user_token_secret | Secret for the user-token. | someUserTokenSecret123
user_token_temp_max_age_in_seconds |  Max-age of the user-token-temp in seconds. | 3600
user_token_temp_secret | Secret for the user-token-temp. | someUserTokenTempSecret123
refresh_token_secret | Secret for the refresh-token. | someRefreshTokenSecret123

### Tokens

#### Admin-Token (PG)
The `Admin-Token` is used to verify the pg-user is qualified to execute certain functions or access views. For example you need it to execute most of the auth-functions or access the V-Views.

An `Admin-Token` is generated by this code:

```
const ts = Date.now().toString();

const payload = `${ts}:${adminSecret}`;

return `${ts}:${sha256(payload)}`;
```

You can also get it by `auth.getAdminSignature(adminSecret)`.

It expires after 60 seconds.

To execute a function or query which requires admin access just execute this before in the same transaction:

```
SET LOCAL auth.admin_token TO ${adminToken}
```

#### User-Token (PG)
A `User-Token` is issued to a user after a successful login. It is required to access any user-specific data. A view can get the userId only if the `current_user_id()` function throws no error. If the set user-token is invalid an error will be thrown by the mentioned function.

The `login` resolver of GraphQl will put this token and it's payload into a jwt-token, which is the `Access-Token` a user gets issued.

#### User-Token-Temp (PG)
This token is issued after registration or a forgotten password and expires by default after one hour. It can only set a new password in these two cases and is invalid after this action. This is basically the same kind of token as the `User-Token`, however with another secret and expiration-time.

#### Access-Token (JWT)
As mantioned before this token includes a `User-Token` or `User-Token-Temp` and their payload. It is issued to the user by `login` mutation, `forgotPassword` mutation, `refreshUserToken` mutation and to the notification function, which will send it in an email or something to the user.

#### Refresh-Token (PG)
The `Refresh-Token (PG)` is issued by `_meta.login()` and `_meta.refresh_user_token()` function. Combined with a valid `User-Token` the `_meta.refresh_user_token()` function will generate a new `User-Token` and `Refresh-Token (PG)`. It gets issued to the user inside a JWT token (`Refresh-Token (JWT)`).

#### Refresh-Token (JWT)
A token which includes the `Refresh-Token (PG)` to be passed to `refreshUserToken` mutation.

#### Privacy-Token (JWT)
A token issued by `createPrivacyToken` mutation. To validate that a user has accepted the privacy-terms. If `config.auth.privacy.active === true` you need to pass it as http-header (default: `X-Privacy-Token`) when creating a new user and when using oAuth as query-parameter (default: `privacyToken`).

#### Auth-Token (JWT)
A `Auth-Token` is issued by a third-party auth-provider. It verifies the ownership of a certain e-mail address to a user. You can use it to register new users by passing it as http-header (default: `X-Auth-Token`). Users which have been created by an `Auth-Token` can also login with a `Auth-Token` of the same provider.

### Config
You can see all config-fields [here]('../config/default.js').

To get started you only need to set the following secrets:

- jwt
- admin (needs to be the same as `admin_token_secret` from `_meta.Auth`)
- provider
- cookie
- jwtRefreshToken
- privacyToken
- authToken

## Setup
To setup this package first include it into your project at `index.ts`:

```
import { Auth } from '@fullstack-one/auth';

const auth: Auth = Container.get(Auth);
```

In your config file these fields should be set:

- `auth.secrets.jwt`
- `auth.secrets.admin` (needs to be the same as `admin_token_secret` from `_meta.Auth`)
- `auth.secrets.provider`
- `auth.secrets.cookie`
- `auth.secrets.jwtRefreshToken`
- `auth.secrets.privacyToken`
- `auth.secrets.authToken`

Furthermore you should change the values of these `_meta.Auth` table keys to some cryptographically secure random values:

- `admin_token_secret`
- `auth_pw_secret`
- `user_token_secret`
- `user_token_temp_secret`
- `refresh_token_secret`