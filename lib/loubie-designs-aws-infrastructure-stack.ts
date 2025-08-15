import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import { Construct } from 'constructs';

export class LoubieDesignsInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for storing photos
    const photoBucket = new s3.Bucket(this, 'LoubieDesignsPhotoBucket', {
      bucketName: `loubie-designs-photos-${this.account}-${this.region}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedOrigins: ['*'], // Restrict this to your domain in production
          allowedMethods: [s3.HttpMethods.GET],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep photos on stack deletion
    });

    // CloudFront Origin Access Identity for S3
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'PhotoBucketOAI',
      {
        comment: 'OAI for Loubie Designs photo bucket',
      }
    );

    // Grant CloudFront access to S3 bucket
    photoBucket.grantRead(originAccessIdentity);

    // CloudFront Distribution for photo delivery
    const photoDistribution = new cloudfront.Distribution(
      this,
      'PhotoDistribution',
      {
        defaultBehavior: {
          origin: new origins.S3Origin(photoBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
        enableIpv6: true,
        comment: 'Loubie Designs Photo CDN',
      }
    );

    // DynamoDB table for photo metadata
    const photoMetadataTable = new dynamodb.Table(this, 'PhotoMetadataTable', {
      tableName: `loubie-designs-photo-metadata-${this.account}-${this.region}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep data on stack deletion
      
      // Global Secondary Index for category filtering
      globalSecondaryIndexes: [
        {
          indexName: 'CategoryIndex',
          partitionKey: {
            name: 'category',
            type: dynamodb.AttributeType.STRING,
          },
          sortKey: {
            name: 'createdAt',
            type: dynamodb.AttributeType.STRING,
          },
        },
        {
          indexName: 'FeaturedIndex',
          partitionKey: {
            name: 'featured',
            type: dynamodb.AttributeType.STRING,
          },
          sortKey: {
            name: 'createdAt',
            type: dynamodb.AttributeType.STRING,
          },
        },
        {
          indexName: 'PortfolioIndex',
          partitionKey: {
            name: 'portfolio',
            type: dynamodb.AttributeType.STRING,
          },
          sortKey: {
            name: 'createdAt',
            type: dynamodb.AttributeType.STRING,
          },
        },
      ],
    });

    // IAM role for Amplify app to access AWS resources
    const amplifyExecutionRole = new iam.Role(this, 'AmplifyExecutionRole', {
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
      description: 'Execution role for Loubie Designs Amplify app',
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:BatchGetItem',
              ],
              resources: [
                photoMetadataTable.tableArn,
                `${photoMetadataTable.tableArn}/index/*`,
              ],
            }),
          ],
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:ListBucket',
              ],
              resources: [
                photoBucket.bucketArn,
                `${photoBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Output important values
    new cdk.CfnOutput(this, 'PhotoBucketName', {
      value: photoBucket.bucketName,
      description: 'S3 bucket name for photos',
      exportName: 'LoubieDesigns-PhotoBucketName',
    });

    new cdk.CfnOutput(this, 'PhotoDistributionDomain', {
      value: photoDistribution.distributionDomainName,
      description: 'CloudFront distribution domain for photos',
      exportName: 'LoubieDesigns-PhotoCDN',
    });

    new cdk.CfnOutput(this, 'PhotoMetadataTableName', {
      value: photoMetadataTable.tableName,
      description: 'DynamoDB table name for photo metadata',
      exportName: 'LoubieDesigns-MetadataTableName',
    });

    new cdk.CfnOutput(this, 'AmplifyExecutionRoleArn', {
      value: amplifyExecutionRole.roleArn,
      description: 'IAM role ARN for Amplify app',
      exportName: 'LoubieDesigns-AmplifyRoleArn',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region',
      exportName: 'LoubieDesigns-Region',
    });
  }
}