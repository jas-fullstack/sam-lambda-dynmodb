# SAM Users API

JavaScript users API on AWS Lambda, using AWS SAM, Express, and GitHub Actions.

You write JavaScript. `sam build` uploads that same source (plus `node_modules`) to Lambda, so the code in the Lambda console matches the repo.

Repo: [jas-fullstack/sam-lambda-dynmodb](https://github.com/jas-fullstack/sam-lambda-dynmodb)

## How it works

```
Client
  → API Gateway  (ANY /{proxy+} and ANY /)
    → Lambda     (users-dev / users-staging / users-prod)
      → Express  (routes in src/users)
```

1. API Gateway receives the HTTP request.
2. It invokes one Lambda. The handler is `app.lambdaHandler`.
3. `@codegenie/serverless-express` turns the API Gateway event into a normal HTTP request.
4. Express routes it:
   - `GET /users` — list users
   - `GET /users/:id` — one user
5. User data is in memory in `src/users/data/users.js` (not DynamoDB). Data resets when Lambda is cold-started.

`sam build` packages your `.js` files as they are. There is no TypeScript compile or minify step.

### Stages

Each stage is a **separate CloudFormation stack** (own API, Lambda, URL).

| Stage     | Stack              | Lambda           | Memory |
|-----------|--------------------|------------------|--------|
| `dev`     | `users-api-dev`    | `users-dev`      | 128 MB |
| `staging` | `users-api-staging`| `users-staging`  | 256 MB |
| `prod`    | `users-api-prod`   | `users-prod`     | 512 MB |

Lambda gets `STAGE=dev|staging|prod`.

URL shape:

```text
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/users
```

### Project layout

```text
template.yaml                 SAM / CloudFormation
samconfig.toml                deploy settings (region, stacks)
src/users/
  app.js                      Lambda entry (wraps Express)
  server.js                   Express app
  local.js                    local server (no Docker)
  routes/users.js             Express routes
  handlers/                   route handlers
  data/users.js               in-memory users
infra/github-actions-oidc.yaml  IAM role so GitHub can deploy
.github/workflows/cicd.yml    CI/CD
```

## Prerequisites

- Node.js 22+
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- AWS CLI, with an account you can deploy to
- Docker Desktop (only for `sam local start-api`)

## Run locally

### Option A — Express only (no Docker, no SAM)

```bash
cd src/users
npm install
npm run local
```

```bash
curl http://127.0.0.1:3000/users
curl http://127.0.0.1:3000/users/1
```

### Option B — SAM local API (needs Docker running)

```bash
cd src/users && npm install && cd ../..
sam build
sam local start-api
```

```bash
curl http://127.0.0.1:3000/users
curl http://127.0.0.1:3000/users/1
```

## Deploy from your laptop

1. Configure AWS:

```bash
aws configure
# or: aws login
```

Set region in `samconfig.toml` if you are not using `ap-south-1`.

2. Build and deploy **dev**:

```bash
sam build
sam deploy --config-env dev
```

3. Other stages:

```bash
sam deploy --config-env staging
sam deploy --config-env prod
```

4. After deploy, print the URL:

```bash
aws cloudformation describe-stacks \
  --stack-name users-api-dev \
  --query "Stacks[0].Outputs" \
  --output table
```

SAM also creates `aws-sam-cli-managed-default` (an S3 bucket for upload artifacts). That is normal.

### What AWS creates (per stage)

- API Gateway REST API + stage
- Lambda function
- IAM role for the Lambda
- Lambda permissions so API Gateway can invoke it
- CloudFormation stack

## GitHub Actions CI/CD

Workflow: `.github/workflows/cicd.yml`

| Event                         | What happens          |
|-------------------------------|-----------------------|
| Pull request                  | Build + validate only |
| Push to `dev`                 | Deploy **dev**        |
| Push to `main`                | Deploy **dev**        |
| Push to `staging`             | Deploy **staging**    |
| Push to `prod`                | Deploy **prod**       |
| Actions → Run workflow        | Pick stage manually   |

GitHub assumes IAM role `github-actions-sam-deploy` with OIDC. No access keys in the repo.

Required GitHub secret:

- `AWS_ROLE_ARN` — ARN of `github-actions-sam-deploy`

## Set this up in another AWS account

Use a fresh AWS account, the same GitHub repo (or a fork), and your own region if you want.

### 1. Clone and install

```bash
git clone https://github.com/jas-fullstack/sam-lambda-dynmodb.git
cd sam-lambda-dynmodb
cd src/users && npm install && cd ../..
```

### 2. Point config at the new account and region

In `samconfig.toml`, set `region` under every `[*.global.parameters]` and `[*.deploy.parameters]` block (for example `us-east-1`).

In `.github/workflows/cicd.yml`, set:

```yaml
env:
  AWS_REGION: us-east-1
```

Log in to the **new** account:

```bash
aws sts get-caller-identity
```

Confirm `Account` is the new one.

### 3. Deploy the app once from your laptop (optional but useful)

```bash
sam build
sam deploy --config-env dev
```

This creates the users API stack in the new account.

### 4. Allow GitHub Actions to deploy (OIDC)

Replace `YOUR_GITHUB_USER` and `YOUR_REPO` (fork example: `my-user/sam-lambda-dynmodb`).

```bash
aws cloudformation deploy \
  --template-file infra/github-actions-oidc.yaml \
  --stack-name github-actions-sam-oidc \
  --parameter-overrides GitHubOrg=YOUR_GITHUB_USER GitHubRepo=YOUR_REPO \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-south-1
```

Use the same region you put in `samconfig.toml`.

New GitHub repos (2026+) send an immutable OIDC `sub` like
`repo:user@123/repo@456:ref:refs/heads/main`. The template already allows that
pattern. If assume-role still fails, compare CloudTrail `userName` to the role trust policy.

If that account **already** has a GitHub OIDC provider, this stack may fail on `GitHubOidcProvider`. Then create only the IAM role, or delete the leftover provider and retry.

Read the role ARN:

```bash
aws cloudformation describe-stacks \
  --stack-name github-actions-sam-oidc \
  --query "Stacks[0].Outputs[?OutputKey=='RoleArn'].OutputValue" \
  --output text
```

### 5. Add the secret on GitHub

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Name           | Value                                      |
|----------------|--------------------------------------------|
| `AWS_ROLE_ARN` | `arn:aws:iam::NEW_ACCOUNT_ID:role/github-actions-sam-deploy` |

If the workflow uses GitHub Environments (`dev`, `staging`, `prod`), add the same secret on each environment as well.

If you forked the repo, also change the OIDC trust in `infra/github-actions-oidc.yaml` so `GitHubOrg` / `GitHubRepo` match the fork, then redeploy that stack.

### 6. Push to deploy

```bash
git push origin main
```

`main` deploys **dev**. Check the **Actions** tab.

### 7. If OIDC already exists in that account

```text
An error occurred: GitHubOidcProvider already exists
```

The provider URL is always `token.actions.githubusercontent.com` (one per account). Remove the `GitHubOidcProvider` resource from a copy of the template and set the role’s `Federated` principal to:

```text
arn:aws:iam::NEW_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com
```

Then deploy the role only.

## How to get API endpoints

After deploy, SAM prints **Outputs**. `UsersApiUrl` is the users API.

Current **dev** endpoint (this account, `ap-south-1`):

```text
https://kj3pycssqj.execute-api.ap-south-1.amazonaws.com/dev/users
```

```bash
curl https://kj3pycssqj.execute-api.ap-south-1.amazonaws.com/dev/users
curl https://kj3pycssqj.execute-api.ap-south-1.amazonaws.com/dev/users/1
```

Read the URL from CloudFormation anytime:

```bash
aws cloudformation describe-stacks \
  --stack-name users-api-dev \
  --region ap-south-1 \
  --query "Stacks[0].Outputs[?OutputKey=='UsersApiUrl'].OutputValue" \
  --output text
```

For other stages, use `users-api-staging` or `users-api-prod`. Those stacks exist only after you deploy that stage.

**Local**

- Express (`npm run local`): `http://127.0.0.1:3000/users`
- SAM local (`sam local start-api`): `http://127.0.0.1:3000/users`

Routes: `GET /users` and `GET /users/{id}`.

## API examples

```bash
# list
curl https://{api-id}.execute-api.{region}.amazonaws.com/dev/users

# one user
curl https://{api-id}.execute-api.{region}.amazonaws.com/dev/users/1
```

Sample body:

```json
{
  "users": [
    { "id": "1", "name": "Alice", "email": "alice@example.com" }
  ]
}
```

## Add another route

1. Add a handler under `src/users/handlers/`.
2. Register it in `src/users/routes/users.js`.
3. Rebuild (`sam build`) or just use `npm run local`.

You do not add a new API Gateway event for each Express path. The proxy `/{proxy+}` forwards everything to Express.

## Cleanup

```bash
sam delete --config-env dev
sam delete --config-env staging
sam delete --config-env prod
aws cloudformation delete-stack --stack-name github-actions-sam-oidc
aws cloudformation delete-stack --stack-name aws-sam-cli-managed-default
```

The managed stack owns the SAM upload bucket. Delete it only if you no longer deploy with SAM in that account.  
