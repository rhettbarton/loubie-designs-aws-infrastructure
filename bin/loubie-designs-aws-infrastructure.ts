#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LoubieDesignsInfrastructureStack } from '../lib/loubie-designs-aws-infrastructure-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'dev';

new LoubieDesignsInfrastructureStack(app, `LoubieDesignsInfrastructureStack-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
  description: 'Infrastructure for Loubie Designs portfolio website',
});