# SevisPortal Deployment Guide

## Amplify Gen 2 Setup

This project uses Amplify Gen 2 with the new code-first approach.

### Prerequisites

1. AWS CLI configured with appropriate permissions
2. Node.js 18+ installed
3. npm or yarn package manager

### Deployment Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Deploy Amplify Backend**
   ```bash
   npx ampx sandbox
   ```
   
   This will:
   - Deploy the authentication (Cognito)
   - Deploy the data layer (AppSync + DynamoDB)
   - Deploy storage (S3)
   - Set up IAM roles with Rekognition permissions

3. **Verify Deployment**
   ```bash
   node scripts/check-deployment.js
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Test API Endpoints**
   - Visit `http://localhost:3000/api/test-amplify` to verify credentials
   - Test SevisPass registration at `/sevispass/register`

### Troubleshooting

#### "No AWS credentials available" Error

This usually means the backend isn't deployed or there's a configuration issue:

1. **Check if backend is deployed:**
   ```bash
   ls amplify_outputs.json
   ```
   If this file doesn't exist, run `npx ampx sandbox`

2. **Redeploy backend:**
   ```bash
   npx ampx sandbox --once
   ```

3. **Check IAM permissions:**
   The backend should automatically create roles with Rekognition permissions. Verify in AWS Console:
   - Go to IAM > Roles
   - Look for roles containing "amplify" and "auth"
   - Check they have Rekognition permissions

4. **Restart dev server:**
   After backend changes, restart your Next.js dev server

#### Authentication Issues

- The app supports both authenticated and unauthenticated access
- Unauthenticated users get temporary credentials via Cognito Identity Pool
- Check `amplify_outputs.json` has `unauthenticated_identities_enabled: true`

### Backend Configuration

The backend is defined in `amplify/backend.ts` and includes:

- **Authentication**: Cognito User Pool + Identity Pool
- **Data**: GraphQL API with DynamoDB
- **Storage**: S3 bucket for document/image storage
- **IAM Permissions**: Rekognition access for face recognition and text extraction

### Environment Variables

No environment variables are needed - all configuration comes from `amplify_outputs.json` generated during deployment.