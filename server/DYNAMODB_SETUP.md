# DynamoDB Setup Guide

This guide will help you set up DynamoDB for the EduRise backend.

## Prerequisites

1. AWS Account with DynamoDB access
2. AWS Access Key ID and Secret Access Key
3. Node.js installed

## Step 1: Configure AWS Credentials

Add these environment variables to your `.env` file or deployment platform:

```env
# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# DynamoDB Table Names (optional - defaults provided)
DYNAMODB_USERS_TABLE=edurise-users
DYNAMODB_LINKS_TABLE=edurise-links
DYNAMODB_ANALYTICS_TABLE=edurise-analytics

# Enable DynamoDB (set to 'false' to use JSON file instead)
USE_DYNAMODB=true
```

## Step 2: Create DynamoDB Tables

Run the setup script to create the required tables:

```bash
cd server
node setup-dynamodb.js
```

This will create three tables:
- `edurise-users` - Stores user/affiliate data
- `edurise-links` - Stores UniLink data
- `edurise-analytics` - Stores analytics/statistics data

## Step 3: Verify Tables

Check your AWS Console → DynamoDB to verify the tables were created.

## Step 4: Start the Server

```bash
npm start
```

The server will now use DynamoDB for all data operations.

## Troubleshooting

### Error: "Cannot find module '@aws-sdk/client-dynamodb'"

Install dependencies:
```bash
npm install
```

### Error: "Access Denied" or "Invalid credentials"

1. Verify your AWS credentials are correct
2. Check IAM permissions for DynamoDB:
   - `dynamodb:CreateTable`
   - `dynamodb:PutItem`
   - `dynamodb:GetItem`
   - `dynamodb:Query`
   - `dynamodb:Scan`
   - `dynamodb:UpdateItem`
   - `dynamodb:DeleteItem`

### Error: "Table already exists"

This is normal if you've run the setup script before. The script will skip existing tables.

### Switch back to JSON file storage

Set in `.env`:
```env
USE_DYNAMODB=false
```

## Table Structure

### Users Table
- **Primary Key**: `id` (String)
- Stores: User registration data, social handles, approval status

### Links Table
- **Primary Key**: `id` (String)
- Stores: UniLink data, AppTrove link IDs

### Analytics Table
- **Primary Key**: `id` (String)
- Stores: Clicks, conversions, earnings, dates

## Production Deployment

For production (Railway, Render, etc.), set environment variables:

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
USE_DYNAMODB=true
```

## Cost Considerations

DynamoDB uses **on-demand pricing** (PAY_PER_REQUEST), so you only pay for what you use:
- First 25 GB storage: Free
- After that: $0.25 per GB/month
- Read/Write requests: $1.25 per million requests

For small to medium applications, this is typically very affordable.
