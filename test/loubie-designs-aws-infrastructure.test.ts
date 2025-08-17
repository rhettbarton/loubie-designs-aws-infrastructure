
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LoubieDesignsInfrastructureStack } from '../lib/loubie-designs-aws-infrastructure-stack';

describe('Loubie Designs Infrastructure Stack', () => {
	let app: cdk.App;
	let stack: LoubieDesignsInfrastructureStack;
	let template: Template;

	beforeAll(() => {
		app = new cdk.App({
			context: { environment: 'dev' },
		});
		stack = new LoubieDesignsInfrastructureStack(app, 'TestStack');
		template = Template.fromStack(stack);
	});

		test('S3 bucket is created with correct properties', () => {
			template.hasResourceProperties('AWS::S3::Bucket', {
				CorsConfiguration: {
					CorsRules: [
						{
							AllowedOrigins: [
								'http://localhost:5173',
								'http://localhost:3000',
							],
							AllowedMethods: ['GET'],
							AllowedHeaders: ['*'],
							MaxAge: 3600,
						},
					],
				},
				PublicAccessBlockConfiguration: {
					BlockPublicAcls: true,
					BlockPublicPolicy: true,
					IgnorePublicAcls: true,
					RestrictPublicBuckets: true,
				},
			});
		});

		test('DynamoDB table is created with correct properties', () => {
			template.hasResourceProperties('AWS::DynamoDB::Table', {
				BillingMode: 'PAY_PER_REQUEST',
				PointInTimeRecoverySpecification: {
					PointInTimeRecoveryEnabled: true,
				},
				KeySchema: [
					{ AttributeName: 'id', KeyType: 'HASH' },
				],
			});
		});

		test('CloudFront distribution is created', () => {
			template.resourceCountIs('AWS::CloudFront::Distribution', 1);
			template.hasResourceProperties('AWS::CloudFront::Distribution', {
				DistributionConfig: {
					Enabled: true,
					PriceClass: 'PriceClass_100',
					DefaultCacheBehavior: {
						ViewerProtocolPolicy: 'redirect-to-https',
					},
				},
			});
		});

		test('IAM role for Amplify is created with correct policies', () => {
			template.hasResourceProperties('AWS::IAM::Role', {
				AssumeRolePolicyDocument: {
					Statement: [
						{
							Effect: 'Allow',
							Action: 'sts:AssumeRole',
							Principal: { Service: 'amplify.amazonaws.com' },
						},
					],
					Version: '2012-10-17',
				},
				Description: 'Execution role for Loubie Designs Amplify app',
			});
		});
});
