import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { storage } from './storage/resource.js';

const backend = defineBackend({
  auth,
  data,
  storage,
});

// Add Rekognition permissions to authenticated and unauthenticated roles
const rekognitionPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'rekognition:DetectText',
    'rekognition:CompareFaces',
    'rekognition:DetectFaces',
    'rekognition:DetectLabels',
    'rekognition:DetectModerationLabels',
    'rekognition:IndexFaces',
    'rekognition:SearchFacesByImage',
    'rekognition:CreateCollection',
    'rekognition:DeleteCollection',
    'rekognition:ListCollections',
    'rekognition:DeleteFaces'
  ],
  resources: ['*']
});

// Add policy to both authenticated and unauthenticated roles
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(rekognitionPolicy);
backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(rekognitionPolicy);
