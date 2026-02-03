#!/bin/bash
# Load environment variables from .env file if it exists
# For production, set these in your environment or use a secrets manager

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Set defaults if not provided
export AWS_REGION=${AWS_REGION:-"ap-south-1"}
export DYNAMODB_USERS_TABLE=${DYNAMODB_USERS_TABLE:-"edurise-users"}
export DYNAMODB_LINKS_TABLE=${DYNAMODB_LINKS_TABLE:-"edurise-links"}
export DYNAMODB_ANALYTICS_TABLE=${DYNAMODB_ANALYTICS_TABLE:-"edurise-analytics"}
export APPTROVE_API_URL=${APPTROVE_API_URL:-"https://api.apptrove.com"}
export APPTROVE_DOMAIN=${APPTROVE_DOMAIN:-"applink.reevo.in"}

# AWS credentials should be set via environment variables or .env file
# DO NOT hardcode credentials in this file

python3 main.py
