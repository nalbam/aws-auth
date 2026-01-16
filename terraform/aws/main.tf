# AWS IAM Identity Center Terraform Configuration
# Note: As of Terraform AWS provider v5.x, IAM Identity Center resources have limited support
# This configuration shows the structure; some resources may need manual configuration

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "identity_center_instance_arn" {
  description = "ARN of the IAM Identity Center instance"
  type        = string
}

# Permission Sets
resource "aws_ssoadmin_permission_set" "admin_access" {
  name             = "AdminAccess"
  description      = "Full administrator access to AWS"
  instance_arn     = var.identity_center_instance_arn
  session_duration = "PT12H"
}

resource "aws_ssoadmin_managed_policy_attachment" "admin_policy" {
  instance_arn       = var.identity_center_instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.admin_access.arn
  managed_policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_ssoadmin_permission_set" "developer_access" {
  name             = "DeveloperAccess"
  description      = "Developer access to specific AWS services"
  instance_arn     = var.identity_center_instance_arn
  session_duration = "PT8H"
}

resource "aws_ssoadmin_managed_policy_attachment" "developer_ec2" {
  instance_arn       = var.identity_center_instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.developer_access.arn
  managed_policy_arn = "arn:aws:iam::aws:policy/AmazonEC2FullAccess"
}

resource "aws_ssoadmin_managed_policy_attachment" "developer_s3" {
  instance_arn       = var.identity_center_instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.developer_access.arn
  managed_policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_ssoadmin_permission_set" "readonly_access" {
  name             = "ReadOnlyAccess"
  description      = "Read-only access to AWS services"
  instance_arn     = var.identity_center_instance_arn
  session_duration = "PT8H"
}

resource "aws_ssoadmin_managed_policy_attachment" "readonly_policy" {
  instance_arn       = var.identity_center_instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.readonly_access.arn
  managed_policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# Outputs
output "permission_set_arns" {
  description = "ARNs of created permission sets"
  value = {
    admin_access     = aws_ssoadmin_permission_set.admin_access.arn
    developer_access = aws_ssoadmin_permission_set.developer_access.arn
    readonly_access  = aws_ssoadmin_permission_set.readonly_access.arn
  }
}

# Note: Identity source configuration (SAML IdP) must be done manually or via AWS CLI
# The AWS provider doesn't yet support configuring external identity sources via Terraform

# Example AWS CLI commands for reference:
# 
# # Get Identity Center instance details
# aws sso-admin list-instances
# 
# # Configure external identity provider (must be done manually via console or API)
# # This involves uploading Auth0 SAML metadata
#
# # Create groups (for JIT provisioning)
# aws identitystore list-groups --identity-store-id <IDENTITY_STORE_ID>
