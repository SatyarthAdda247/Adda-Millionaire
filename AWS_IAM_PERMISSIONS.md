# AWS IAM Permissions for DynamoDB

If you're getting **403 Forbidden** errors, your AWS credentials don't have the required DynamoDB permissions.

## Required IAM Permissions

Your AWS IAM user needs these permissions for DynamoDB:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-south-1:*:table/edurise-users",
        "arn:aws:dynamodb:ap-south-1:*:table/edurise-users/*",
        "arn:aws:dynamodb:ap-south-1:*:table/edurise-links",
        "arn:aws:dynamodb:ap-south-1:*:table/edurise-links/*",
        "arn:aws:dynamodb:ap-south-1:*:table/edurise-analytics",
        "arn:aws:dynamodb:ap-south-1:*:table/edurise-analytics/*"
      ]
    }
  ]
}
```

## How to Fix

### Step 1: Go to AWS IAM Console
1. Log in to AWS Console: https://console.aws.amazon.com/iam/
2. Go to **Users** → Find your user (the one with Access Key ID: `REMOVED`)
3. Click on the user name

### Step 2: Add Permissions
1. Click **"Add permissions"** button
2. Choose **"Attach policies directly"**
3. Search for **"AmazonDynamoDBFullAccess"** or create a custom policy

### Option A: Use Full Access (Easier)
- Search: `AmazonDynamoDBFullAccess`
- Check the box
- Click **"Next"** → **"Add permissions"**

### Option B: Create Custom Policy (More Secure)
1. Click **"Create policy"**
2. Go to **JSON** tab
3. Paste the JSON above
4. Name it: `EduRiseDynamoDBAccess`
5. Click **"Create policy"**
6. Go back to Users → Your user → Add permissions → Attach the new policy

### Step 3: Verify
After adding permissions, wait 1-2 minutes for them to propagate, then:
1. Try submitting the form again
2. Check browser console for errors
3. Should see `✅ DynamoDB configured` message

## Common 403 Errors

### "AccessDeniedException"
**Cause:** IAM user doesn't have DynamoDB permissions  
**Fix:** Add permissions as shown above

### "ResourceNotFoundException"
**Cause:** DynamoDB tables don't exist  
**Fix:** Run `node server/setup-dynamodb.js` to create tables

### "UnauthorizedOperation"
**Cause:** AWS credentials are invalid or expired  
**Fix:** Check credentials in Vercel environment variables

## Testing Permissions

You can test if permissions work:

```bash
# Test with AWS CLI (if installed)
aws dynamodb scan --table-name edurise-users --region ap-south-1
```

If this works, your permissions are correct.

## Security Best Practices

1. **Use least privilege** - Only grant necessary permissions
2. **Use separate IAM user** - Don't use root account credentials
3. **Rotate credentials** - Change access keys periodically
4. **Monitor usage** - Check CloudWatch for unusual activity

## Still Getting 403?

1. **Check credentials are correct** in Vercel environment variables
2. **Verify region** is `ap-south-1` (matches your DynamoDB tables)
3. **Wait 2-3 minutes** after adding permissions (AWS propagation delay)
4. **Check AWS Console** → DynamoDB → Tables exist
5. **Check IAM** → Users → Your user → Permissions tab
