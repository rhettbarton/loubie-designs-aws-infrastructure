
# Loubie Designs AWS Infrastructure

This repository contains the AWS CDK (TypeScript) infrastructure code for the Loubie Designs website. It provisions secure AWS resources for hosting photos, metadata, and supporting the [Amplify frontend](https://github.com/rhettbarton/loubie_designs).

## Codebase Structure

- `bin/loubie-designs-aws-infrastructure.ts`: CDK app entry point.
- `lib/loubie-designs-aws-infrastructure-stack.ts`: Main stack definition (S3, CloudFront, DynamoDB, IAM, CORS, etc).
- `test/`: Example unit tests for stack resources.
- `cdk.json`: CDK configuration.
- `package.json`: Project dependencies and scripts.
- `tsconfig.json`: TypeScript configuration.

## Main AWS Resources

- **S3 Bucket**: Secure storage for photos, with CORS and lifecycle rules.
- **CloudFront Distribution**: CDN for photo delivery, restricted via Origin Access Identity.
- **DynamoDB Table**: Stores photo metadata with global secondary indexes.
- **IAM Role**: For Amplify app to access S3 and DynamoDB (read-only by default).

## Deployment & Update Steps

### Prerequisites

- Node.js and npm installed
- AWS CLI installed and configured
- AWS CDK installed globally (`npm install -g aws-cdk`)
- SSO or IAM user with AdministratorAccess

### 1. Install Dependencies

```sh
npm install
```

### 2. Build the Project

```sh
npm run build
```

### 3. Set your AWS profile and region (if needed)

```sh
export AWS_PROFILE=loubie
export CDK_DEFAULT_REGION=us-west-2
```

### 4. Bootstrap Your AWS Environment (first time only)

```sh
cdk bootstrap
```

### 5. Deploy the Stack

Deploy with environment context:

```sh
cdk deploy --context environment=dev
```

### 6. Update the Stack

Make code changes, then repeat steps 2 and 5 to update resources.

### 6. Destroy the Stack (if needed)

```sh
cdk destroy --context environment=dev
```

## Testing

Run unit tests:

```sh
npm run test
```

## Troubleshooting

- Ensure your AWS user/role has AdministratorAccess for CDK bootstrap and deploy.
- If you see permission errors, check your AWS profile and role policies.
- For bootstrap issues, manually delete the `CDKToolkit` stack in CloudFormation and retry.