import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { storage } from './storage/resource.js';

export const backend = defineBackend({
  auth,
  data,
  storage,
});

// Configure predictions using CDK constructs for Rekognition and Textract
const rekognitionPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'rekognition:CompareFaces', 
    'rekognition:DetectFaces',
    'rekognition:DetectText',      // Added for document text extraction
    'rekognition:IndexFaces',
    'rekognition:SearchFacesByImage',
    'rekognition:CreateCollection',
    'rekognition:ListCollections',
    'rekognition:DeleteFaces'
  ],
  resources: ['*']
});

// Add Textract permissions for document text extraction
const textractPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'textract:DetectDocumentText',
    'textract:AnalyzeDocument',
    'textract:AnalyzeID'
  ],
  resources: ['*']
});

// Add Rekognition and Textract permissions to both authenticated and unauthenticated roles
try {
  backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(rekognitionPolicy);
  backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(textractPolicy);
  console.log('✅ Added Rekognition and Textract policies to authenticated role');
} catch (error) {
  console.error('❌ Failed to add policies to authenticated role:', error);
}

try {
  backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(rekognitionPolicy);
  backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(textractPolicy);
  console.log('✅ Added Rekognition and Textract policies to unauthenticated role');
} catch (error) {
  console.error('❌ Failed to add policies to unauthenticated role:', error);
}
