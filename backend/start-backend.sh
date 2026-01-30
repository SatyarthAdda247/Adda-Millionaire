#!/bin/bash
cd "/Users/adda247/Millionaires Adda/adda-creator-path-main/backend-python"

export AWS_REGION="ap-south-1"
export AWS_ACCESS_KEY_ID="REMOVED"
export AWS_SECRET_ACCESS_KEY="REMOVED"
export DYNAMODB_USERS_TABLE="edurise-users"
export DYNAMODB_LINKS_TABLE="edurise-links"
export DYNAMODB_ANALYTICS_TABLE="edurise-analytics"
export APPTROVE_API_URL="https://api.apptrove.com"
export APPTROVE_API_KEY="82aa3b94-bb98-449d-a372-4a8a98e319f0"
export APPTROVE_SECRET_ID="696dd5aa03258f6b929b7e97"
export APPTROVE_SECRET_KEY="f5a2d4a4-5389-429a-8aa9-cf0d09e9be86"
export APPTROVE_SDK_KEY="5d11fe82-cab7-4b00-87d0-65a5fa40232f"
export APPTROVE_REPORTING_API_KEY="297c9ed1-c4b7-4879-b80a-1504140eb65e"
export APPTROVE_DOMAIN="applink.reevo.in"

python3 main.py
